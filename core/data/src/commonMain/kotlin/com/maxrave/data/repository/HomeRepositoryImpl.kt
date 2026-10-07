package com.maxrave.data.repository

import com.maxrave.data.mapping.toHomeContent
import com.maxrave.data.parser.parseChart
import com.maxrave.data.parser.parseGenreObject
import com.maxrave.data.parser.parseMixedContent
import com.maxrave.data.parser.parseMoodsMomentObject
import com.maxrave.data.parser.parseNewRelease
import com.maxrave.data.db.datasource.LocalDataSource
import com.maxrave.kotlinytmusicscraper.models.WatchEndpoint
import com.maxrave.domain.data.model.home.BrowsePage
import com.maxrave.domain.data.model.home.HomeItem
import com.maxrave.domain.data.model.home.chart.Chart
import com.maxrave.domain.data.model.mood.Mood
import com.maxrave.domain.data.model.mood.MoodItem
import com.maxrave.domain.data.model.mood.MoodSection
import com.maxrave.domain.data.model.mood.genre.GenreObject
import com.maxrave.domain.data.model.mood.moodmoments.MoodsMomentObject
import com.maxrave.domain.manager.DataStoreManager
import com.maxrave.domain.repository.HomeRepository
import com.maxrave.domain.utils.Resource
import com.maxrave.kotlinytmusicscraper.YouTube
import com.maxrave.logger.Logger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.time.Clock
import kotlin.time.ExperimentalTime
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn

/**
 * One resolved category cover plus when it was fetched.
 *
 * Kept with a timestamp because the cover is whatever playlist YouTube happened to rank first in
 * that category — it drifts, so a cached copy should expire rather than stick forever.
 */
@Serializable
private data class MoodArtwork(
    val url: String,
    val cachedAt: Long,
) {
    @OptIn(ExperimentalTime::class)
    fun isStale(): Boolean = Clock.System.now().toEpochMilliseconds() - cachedAt > MOOD_ARTWORK_TTL_MILLIS
}

private const val MOOD_ARTWORK_TTL_MILLIS = 7L * 24 * 60 * 60 * 1000

@OptIn(ExperimentalTime::class)
internal class HomeRepositoryImpl(
    private val dataStoreManager: DataStoreManager,
    private val youTube: YouTube,
    private val localDataSource: LocalDataSource,
) : HomeRepository {
    /**
     * Same posture as the Room converters: a cache written by an older build must not crash the
     * app after the model gains a field, so unknown keys are dropped rather than rejected.
     */
    private val moodJson =
        Json {
            ignoreUnknownKeys = true
        }

    override fun getHomeData(
        params: String?,
        viewString: String,
        songString: String,
    ): Flow<Resource<Pair<String?, List<HomeItem>>>> =
        flow {
            runCatching {
                val isGuest = dataStoreManager.cookie.first().isEmpty()
                if (isGuest && params == null) {
                    val recentId = dataStoreManager.recentMediaId.first()
                    val lastVideoId = if (recentId.isNotEmpty()) {
                        recentId
                    } else {
                        localDataSource.getRecentSongs(1, 0).firstOrNull()?.videoId ?: ""
                    }
                    if (lastVideoId.isNotEmpty()) {
                        val lastSong = localDataSource.getSong(lastVideoId)
                        val songTitle = lastSong?.title ?: ""
                        val artistName = lastSong?.artistName?.firstOrNull() ?: ""

                        val nextResult = youTube.next(WatchEndpoint(videoId = lastVideoId)).getOrNull()
                        if (nextResult != null && nextResult.items.isNotEmpty()) {
                            val relatedRows = mutableListOf<HomeItem>()
                            val relatedBrowseId = nextResult.relatedEndpoint?.browseId
                            if (!relatedBrowseId.isNullOrEmpty()) {
                                youTube.customQuery(browseId = relatedBrowseId).getOrNull()?.let { relatedResponse ->
                                    val relatedContents = relatedResponse.contents
                                        ?.singleColumnBrowseResultsRenderer
                                        ?.tabs
                                        ?.firstOrNull()
                                        ?.tabRenderer
                                        ?.content
                                        ?.sectionListRenderer
                                        ?.contents
                                    val parsed = parseMixedContent(relatedContents, viewString, songString)
                                    relatedRows.addAll(parsed.filter { it.contents.isNotEmpty() })
                                }
                            }

                            val automixItems = nextResult.items.filter { it.id != lastVideoId }
                            val automixContent = automixItems.map { it.toHomeContent() }

                            val homeItems = mutableListOf<HomeItem>()

                            // Row 1: Primary row: "Because you listened to [Song Title]"
                            val primaryChunk = automixContent.take(8)
                            if (primaryChunk.isNotEmpty()) {
                                homeItems.add(
                                    HomeItem(
                                        title = if (songTitle.isNotEmpty()) "Because you listened to $songTitle" else "Recommended for You",
                                        subtitle = if (artistName.isNotEmpty()) "Similar to $songTitle by $artistName" else null,
                                        contents = primaryChunk,
                                    )
                                )
                            }

                            // Row 2: Artist row if available
                            val artistTracks = if (artistName.isNotEmpty()) {
                                automixContent.filter { it.artists?.any { a -> a.name.equals(artistName, ignoreCase = true) } == true }
                            } else emptyList()
                            if (artistTracks.size >= 2) {
                                homeItems.add(
                                    HomeItem(
                                        title = "More from $artistName",
                                        subtitle = "Popular tracks & features",
                                        contents = artistTracks,
                                    )
                                )
                            }

                            // Add rows from related shelves (e.g. "You might also like", "Similar artists")
                            for (rel in relatedRows) {
                                if (homeItems.size < 7) {
                                    homeItems.add(rel)
                                }
                            }

                            // Fill remaining rows from the automix tracks
                            val remainingTracks = automixContent.drop(8).filterNot { track ->
                                artistTracks.any { it.videoId == track.videoId }
                            }

                            val thematicTitles = listOf(
                                "Similar Tracks & Vibes" to "Music matching your current taste",
                                "Radio Mix: ${songTitle.ifEmpty { "Similar Vibes" }}" to "Endless mix based on your last track",
                                "Fans Also Like" to "Tracks popular with listeners of this style",
                                "Recommended for You" to "Songs picked for you",
                                "Discover More" to "Expand your music horizon",
                                "Trending & Related" to "Popular tracks in similar genres",
                            )

                            var themeIdx = 0
                            var chunkOffset = 0
                            while (homeItems.size < 7 && chunkOffset < remainingTracks.size && themeIdx < thematicTitles.size) {
                                val chunk = remainingTracks.drop(chunkOffset).take(6)
                                if (chunk.isNotEmpty()) {
                                    val (t, s) = thematicTitles[themeIdx]
                                    homeItems.add(
                                        HomeItem(
                                            title = t,
                                            subtitle = s,
                                            contents = chunk,
                                        )
                                    )
                                    chunkOffset += 6
                                }
                                themeIdx++
                            }

                            if (homeItems.isNotEmpty()) {
                                emit(Resource.Success<Pair<String?, List<HomeItem>>>(Pair(null, homeItems.take(7))))
                                return@runCatching
                            }
                        }
                    }
                }

                val limit = dataStoreManager.homeLimit.first()
                youTube
                    .customQuery(browseId = "FEmusic_home", params = params)
                    .onSuccess { result ->
                        val list: ArrayList<HomeItem> = arrayListOf()
                        if (result.contents
                                ?.singleColumnBrowseResultsRenderer
                                ?.tabs
                                ?.get(
                                    0,
                                )?.tabRenderer
                                ?.content
                                ?.sectionListRenderer
                                ?.contents
                                ?.get(
                                    0,
                                )?.musicCarouselShelfRenderer
                                ?.header
                                ?.musicCarouselShelfBasicHeaderRenderer
                                ?.strapline
                                ?.runs
                                ?.get(
                                    0,
                                )?.text != null
                        ) {
                            val accountName =
                                result.contents
                                    ?.singleColumnBrowseResultsRenderer
                                    ?.tabs
                                    ?.get(
                                        0,
                                    )?.tabRenderer
                                    ?.content
                                    ?.sectionListRenderer
                                    ?.contents
                                    ?.get(
                                        0,
                                    )?.musicCarouselShelfRenderer
                                    ?.header
                                    ?.musicCarouselShelfBasicHeaderRenderer
                                    ?.strapline
                                    ?.runs
                                    ?.get(
                                        0,
                                    )?.text ?: ""
                            val accountThumbUrl =
                                result.contents
                                    ?.singleColumnBrowseResultsRenderer
                                    ?.tabs
                                    ?.get(
                                        0,
                                    )?.tabRenderer
                                    ?.content
                                    ?.sectionListRenderer
                                    ?.contents
                                    ?.get(
                                        0,
                                    )?.musicCarouselShelfRenderer
                                    ?.header
                                    ?.musicCarouselShelfBasicHeaderRenderer
                                    ?.thumbnail
                                    ?.musicThumbnailRenderer
                                    ?.thumbnail
                                    ?.thumbnails
                                    ?.get(
                                        0,
                                    )?.url
                                    ?.replace("s88", "s352") ?: ""
                            if (accountName != "" && accountThumbUrl != "") {
                                dataStoreManager.putString("AccountName", accountName)
                                dataStoreManager.putString("AccountThumbUrl", accountThumbUrl)
                            }
                        }
                        val continueParam =
                            result.contents
                                ?.singleColumnBrowseResultsRenderer
                                ?.tabs
                                ?.get(
                                    0,
                                )?.tabRenderer
                                ?.content
                                ?.sectionListRenderer
                                ?.continuations
                                ?.get(
                                    0,
                                )?.nextContinuationData
                                ?.continuation
                        val data =
                            result.contents
                                ?.singleColumnBrowseResultsRenderer
                                ?.tabs
                                ?.get(
                                    0,
                                )?.tabRenderer
                                ?.content
                                ?.sectionListRenderer
                                ?.contents
                        list.addAll(
                            parseMixedContent(
                                data,
                                viewString,
                                songString,
                            ),
                        )
//                        var count = 0
//                        while (count < limit && continueParam != null) {
//                            youTube
//                                .customQuery(browseId = "", continuation = continueParam)
//                                .onSuccess { response ->
//                                    continueParam =
//                                        response.continuationContents
//                                            ?.sectionListContinuation
//                                            ?.continuations
//                                            ?.get(
//                                                0,
//                                            )?.nextContinuationData
//                                            ?.continuation
//                                    Logger.d("Repository", "continueParam: $continueParam")
//                                    val dataContinue =
//                                        response.continuationContents?.sectionListContinuation?.contents
//                                    list.addAll(
//                                        parseMixedContent(
//                                            dataContinue,
//                                            viewString,
//                                            songString,
//                                        ),
//                                    )
//                                    count++
//                                    Logger.d("Repository", "count: $count")
//                                }.onFailure {
//                                    Logger.e("Repository", "Error: ${it.message}")
//                                    count++
//                                }
//                        }
                        Logger.d("Repository", "List size: ${list.size}")
                        emit(Resource.Success(continueParam to list.toList()))
                    }.onFailure { error ->
                        emit(Resource.Error<Pair<String?, List<HomeItem>>>(error.message.toString()))
                    }
            }
        }.flowOn(Dispatchers.IO)

    override fun getHomeDataContinue(
        continueParam: String,
        viewString: String,
        songString: String
    ): Flow<Resource<Pair<String?, List<HomeItem>>>> = flow {
        youTube
            .customQuery(browseId = "", continuation = continueParam)
            .onSuccess { response ->
                val newContinueParam =
                    response.continuationContents
                        ?.sectionListContinuation
                        ?.continuations
                        ?.get(
                            0,
                        )?.nextContinuationData
                        ?.continuation
                Logger.d("Repository", "continueParam: $continueParam")
                val dataContinue =
                    response.continuationContents?.sectionListContinuation?.contents
                val list =
                    parseMixedContent(
                        dataContinue,
                        viewString,
                        songString,
                    )
                emit(Resource.Success(newContinueParam to list))
            }.onFailure {
                emit(Resource.Error<Pair<String?, List<HomeItem>>>(it.message.toString()))
            }
    }.flowOn(Dispatchers.IO)

    override fun getNewRelease(
        newReleaseString: String,
        musicVideoString: String,
    ): Flow<Resource<List<HomeItem>>> =
        flow {
            youTube
                .newRelease()
                .onSuccess { result ->
                    emit(Resource.Success<List<HomeItem>>(parseNewRelease(result, newReleaseString, musicVideoString)))
                }.onFailure { error ->
                    emit(Resource.Error<List<HomeItem>>(error.message.toString()))
                }
        }.flowOn(Dispatchers.IO)

    override fun getChartData(countryCode: String): Flow<Resource<Chart>> =
        flow {
            runCatching {
                youTube
                    .customQuery("FEmusic_charts", country = countryCode)
                    .onSuccess { result ->
                        val data =
                            result.contents
                                ?.singleColumnBrowseResultsRenderer
                                ?.tabs
                                ?.get(
                                    0,
                                )?.tabRenderer
                                ?.content
                                ?.sectionListRenderer
                        val chart = parseChart(data)
                        if (chart != null) {
                            emit(Resource.Success<Chart>(chart))
                        } else {
                            emit(Resource.Error<Chart>("Error"))
                        }
                    }.onFailure { error ->
                        emit(Resource.Error<Chart>(error.message.toString()))
                    }
            }
        }.flowOn(Dispatchers.IO)

    override fun getMoodAndMomentsData(): Flow<Resource<Mood>> =
        flow {
            // Serve the cached copy first so the grid paints instantly; the network result is
            // emitted right after and overwrites it. The category list changes about as often as
            // YouTube ships a new mood, so a stale frame costs nothing while a spinner does.
            val cached =
                dataStoreManager.moodAndGenresCache
                    .first()
                    ?.let { runCatching { moodJson.decodeFromString<Mood>(it) }.getOrNull() }
            if (cached != null) {
                emit(Resource.Success<Mood>(cached))
            }
            runCatching {
                youTube
                    .moodAndGenres()
                    .onSuccess { result ->
                        // Every section is kept, in the order YouTube sent it, under its own
                        // title. Indexing result[0]/result[1] used to break the moment a
                        // signed-in account got an extra "For you" section in front.
                        val sections =
                            result.map { section ->
                                MoodSection(
                                    title = section.title,
                                    items =
                                        section.items.map { item ->
                                            MoodItem(
                                                title = item.title,
                                                params = item.endpoint.params ?: "",
                                                stripeColor = item.stripeColor,
                                            )
                                        },
                                )
                            }
                        val mood = Mood(sections)
                        emit(Resource.Success<Mood>(mood))
                        dataStoreManager.setMoodAndGenresCache(moodJson.encodeToString(mood))
                    }.onFailure { e ->
                        // Already showing the cached copy — surfacing an error over it would
                        // replace working content with an error state.
                        if (cached == null) {
                            emit(Resource.Error<Mood>(e.message.toString()))
                        }
                    }
            }
        }.flowOn(Dispatchers.IO)

    override fun getMoodCategoryArtwork(params: String): Flow<String?> =
        flow {
            val cache = readMoodArtworkCache()
            val hit = cache[params]
            if (hit != null && !hit.isStale()) {
                emit(hit.url)
                return@flow
            }
            val resolved =
                youTube
                    .customQuery(
                        browseId = "FEmusic_moods_and_genres_category",
                        params = params,
                    ).getOrNull()
                    ?.let { parseMoodsMomentObject(it) }
                    ?.items
                    ?.firstNotNullOfOrNull { section ->
                        section.contents
                            .firstNotNullOfOrNull { it.thumbnails?.lastOrNull()?.url }
                    }
            emit(resolved)
            if (resolved != null) {
                dataStoreManager.setMoodArtworkCache(
                    moodJson.encodeToString(
                        cache + (params to MoodArtwork(resolved, Clock.System.now().toEpochMilliseconds())),
                    ),
                )
            }
        }.flowOn(Dispatchers.IO)

    private suspend fun readMoodArtworkCache(): Map<String, MoodArtwork> =
        dataStoreManager.moodArtworkCache
            .first()
            ?.let { runCatching { moodJson.decodeFromString<Map<String, MoodArtwork>>(it) }.getOrNull() }
            .orEmpty()

    override fun getMoodData(params: String): Flow<Resource<MoodsMomentObject>> =
        flow {
            runCatching {
                youTube
                    .customQuery(
                        browseId = "FEmusic_moods_and_genres_category",
                        params = params,
                    ).onSuccess { result ->
                        val data = parseMoodsMomentObject(result)
                        if (data != null) {
                            emit(Resource.Success<MoodsMomentObject>(data))
                        } else {
                            emit(Resource.Error<MoodsMomentObject>("Error"))
                        }
                    }.onFailure { e ->
                        emit(Resource.Error<MoodsMomentObject>(e.message.toString()))
                    }
            }
        }.flowOn(Dispatchers.IO)

    override fun getGenreData(params: String): Flow<Resource<GenreObject>> =
        flow {
            runCatching {
                youTube
                    .customQuery(
                        browseId = "FEmusic_moods_and_genres_category",
                        params = params,
                    ).onSuccess { result ->
                        val data = parseGenreObject(result)
                        if (data != null) {
                            emit(Resource.Success<GenreObject>(data))
                        } else {
                            emit(Resource.Error<GenreObject>("Error"))
                        }
                    }.onFailure { e ->
                        emit(Resource.Error<GenreObject>(e.message.toString()))
                    }
            }
        }.flowOn(Dispatchers.IO)

    override fun getBrowsePage(
        browseId: String,
        params: String?,
    ): Flow<Resource<BrowsePage>> =
        flow {
            youTube
                .browse(browseId = browseId, params = params)
                .onSuccess { result ->
                    emit(
                        Resource.Success(
                            BrowsePage(
                                title = result.title,
                                contents =
                                    result.items
                                        .flatMap { it.items }
                                        .distinctBy { it.id }
                                        .map { it.toHomeContent() },
                                moods =
                                    result.items.flatMap { it.moods }.map { item ->
                                        MoodItem(
                                            title = item.title,
                                            params = item.endpoint.params ?: "",
                                            stripeColor = item.stripeColor,
                                        )
                                    },
                            ),
                        ),
                    )
                }.onFailure { e ->
                    emit(Resource.Error<BrowsePage>(e.message.toString()))
                }
        }.flowOn(Dispatchers.IO)
}