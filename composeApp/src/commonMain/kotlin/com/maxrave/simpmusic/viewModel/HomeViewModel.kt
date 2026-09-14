package com.maxrave.simpmusic.viewModel

import androidx.lifecycle.viewModelScope
import com.maxrave.common.SELECTED_LANGUAGE
import com.maxrave.common.SUPPORTED_LANGUAGE
import com.maxrave.domain.data.entities.SongEntity
import com.maxrave.domain.data.model.home.HomeDataCombine
import com.maxrave.domain.data.model.home.HomeItem
import com.maxrave.domain.data.model.home.chart.Chart
import com.maxrave.domain.data.model.mood.Mood
import com.maxrave.domain.manager.DataStoreManager
import com.maxrave.domain.manager.DataStoreManager.Values.TRUE
import com.maxrave.domain.repository.HomeRepository
import com.maxrave.domain.utils.Resource
import com.maxrave.logger.Logger
import com.maxrave.simpmusic.viewModel.base.BaseViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import simpmusic.composeapp.generated.resources.Res
import com.maxrave.domain.data.model.browse.album.Track
import com.maxrave.domain.data.model.home.Content
import com.maxrave.domain.repository.SongRepository
import com.maxrave.domain.utils.toTrack
import simpmusic.composeapp.generated.resources.quick_picks
import simpmusic.composeapp.generated.resources.music_video
import simpmusic.composeapp.generated.resources.new_release
import simpmusic.composeapp.generated.resources.song
import simpmusic.composeapp.generated.resources.view_count

class HomeViewModel(
    private val dataStoreManager: DataStoreManager,
    private val homeRepository: HomeRepository,
    private val songRepository: SongRepository,
) : BaseViewModel() {
    private val _homeItemList: MutableStateFlow<List<HomeItem>> =
        MutableStateFlow(arrayListOf())
    val homeItemList: StateFlow<List<HomeItem>> = _homeItemList

    private var _homeListState = MutableStateFlow<ListState>(ListState.IDLE)
    val homeListState: StateFlow<ListState> = _homeListState

    private var _continuation = MutableStateFlow<String?>(null)
    val continuation: StateFlow<String?> = _continuation

    private val _exploreMoodItem: MutableStateFlow<Mood?> = MutableStateFlow(null)
    val exploreMoodItem: StateFlow<Mood?> = _exploreMoodItem
    private val _accountInfo: MutableStateFlow<Pair<String?, String?>?> = MutableStateFlow(null)
    val accountInfo: StateFlow<Pair<String?, String?>?> = _accountInfo

    private var homeJob: Job? = null

    val showSnackBarErrorState = MutableSharedFlow<String>()

    private val _chart: MutableStateFlow<Chart?> = MutableStateFlow(null)
    val chart: StateFlow<Chart?> = _chart
    private val _newRelease: MutableStateFlow<List<HomeItem>> = MutableStateFlow(arrayListOf())
    val newRelease: StateFlow<List<HomeItem>> = _newRelease
    var regionCodeChart: MutableStateFlow<String?> = MutableStateFlow(null)

    val loading = MutableStateFlow<Boolean>(true)
    val loadingChart = MutableStateFlow<Boolean>(true)
    private var regionCode: String = ""
    private var language: String = ""

    private val _songEntity: MutableStateFlow<SongEntity?> = MutableStateFlow(null)
    val songEntity: StateFlow<SongEntity?> = _songEntity

    private var _params: MutableStateFlow<String?> = MutableStateFlow(null)
    val params: StateFlow<String?> = _params

    // Debounced trigger: multiple flow collectors (location, language, cookie, params)
    // all request a refresh by emitting to this shared flow. A single debounced
    // collector then calls getHomeItemList() once, preventing the startup stampede
    // where each collector's call would cancel the previous one.
    private val _refreshTrigger = MutableSharedFlow<Unit>(replay = 1, extraBufferCapacity = 16)

    // For showing alert that should log in to YouTube
    private val _showLogInAlert: MutableStateFlow<Boolean> = MutableStateFlow(false)
    val showLogInAlert: StateFlow<Boolean> = _showLogInAlert

    val dataSyncId =
        dataStoreManager
            .dataSyncId
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), "")

    private val _mainHomeThumbnail: MutableStateFlow<String?> = MutableStateFlow(null)
    val mainHomeThumbnail: StateFlow<String?> = _mainHomeThumbnail

    init {
        if (runBlocking { dataStoreManager.cookie.first() }.isEmpty() &&
            runBlocking {
                dataStoreManager.shouldShowLogInRequiredAlert.first() == TRUE
            }
        ) {
            _showLogInAlert.update { true }
        }
        homeJob = Job()
        viewModelScope.launch {
            regionCodeChart.value = dataStoreManager.chartKey.first()
            exploreChart(regionCodeChart.value ?: "ZZ")
            language = dataStoreManager.getString(SELECTED_LANGUAGE).first()
                ?: SUPPORTED_LANGUAGE.codes.first()

            // Single debounced collector: all the flow watchers below emit to
            // _refreshTrigger instead of calling getHomeItemList() directly.
            // The 300ms debounce coalesces the burst of initial emissions
            // (location, language, cookie, params all fire within milliseconds)
            // into a single network request, preventing the stampede where each
            // call would cancel the previous one and leave the UI in an error state.
            val refreshJob =
                launch {
                    @OptIn(kotlinx.coroutines.FlowPreview::class)
                    _refreshTrigger
                        .debounce(300)
                        .collectLatest {
                            getHomeItemList(params.value)
                        }
                }

            //  refresh when region changes
            val job1 =
                launch {
                    dataStoreManager.location.distinctUntilChanged().collect {
                        regionCode = it
                        _refreshTrigger.tryEmit(Unit)
                    }
                }
            //  refresh when language changes
            val job2 =
                launch {
                    dataStoreManager.language.distinctUntilChanged().collect {
                        language = it
                        _refreshTrigger.tryEmit(Unit)
                    }
                }
            val job3 =
                launch {
                    dataStoreManager.cookie.distinctUntilChanged().collect {
                        _refreshTrigger.tryEmit(Unit)
                        _accountInfo.emit(
                            Pair(
                                dataStoreManager.getString("AccountName").first(),
                                dataStoreManager.getString("AccountThumbUrl").first(),
                            ),
                        )
                    }
                }
            val job4 =
                launch {
                    params.collectLatest {
                        _refreshTrigger.tryEmit(Unit)
                    }
                }
            val job5 =
                launch {
                    dataStoreManager
                        .cookie
                        .distinctUntilChanged()
                        .drop(1)
                        .collectLatest {
                            if (it.isNotEmpty()) {
                                Logger.w(tag, "Cookie changed, refreshing home")
                                loading.value = true
                                delay(1000) // To wait for the cookie to be saved properly
                                _refreshTrigger.tryEmit(Unit)
                            }
                        }
                }
            val job6 =
                launch {
                    homeItemList.collectLatest { list ->
                        _mainHomeThumbnail.value =
                            list
                                .firstOrNull()
                                ?.contents
                                ?.firstOrNull()
                                ?.thumbnails
                                ?.lastOrNull()
                                ?.url
                    }
                }
            refreshJob.join()
            job1.join()
            job2.join()
            job3.join()
            job4.join()
            job5.join()
            job6.join()
        }
    }

    fun doneShowLogInAlert(neverShowAgain: Boolean = false) {
        viewModelScope.launch {
            _showLogInAlert.update { false }
            if (neverShowAgain) {
                dataStoreManager.setShouldShowLogInRequiredAlert(false)
            }
        }
    }

    fun getHomeItemList(params: String? = null) {
        loading.value = true
        _homeListState.value = ListState.LOADING
        language =
            runBlocking {
                dataStoreManager.getString(SELECTED_LANGUAGE).first()
                    ?: SUPPORTED_LANGUAGE.codes.first()
            }
        regionCode = runBlocking { dataStoreManager.location.first() }
        homeJob?.cancel()
        homeJob =
            viewModelScope.launch {
                combine(
                    homeRepository.getHomeData(
                        params,
                        getString(Res.string.view_count),
                        getString(Res.string.song),
                    ),
                    homeRepository.getMoodAndMomentsData(),
                    homeRepository.getChartData(dataStoreManager.chartKey.first()),
                    homeRepository.getNewRelease(
                        getString(Res.string.new_release),
                        getString(Res.string.music_video),
                    ),
                ) { home, exploreMood, exploreChart, newRelease ->
                    HomeDataCombine(home, exploreMood, exploreChart, newRelease)
                }.collect { result ->
                    val home = result.home
                    Logger.d("home size", "${home.data?.second?.size}")
                    val exploreMoodItem = result.mood
                    val chart = result.chart
                    val newRelease = result.newRelease
                    when (home) {
                        is Resource.Success -> {
                            _continuation.value = home.data?.first
                            val rawList = home.data?.second ?: listOf()
                            _homeItemList.value = rawList
                            injectListeningRecommendations(rawList, params)
                        }

                        else -> {
                            _continuation.value = null
                            _homeItemList.value = listOf()
                        }
                    }
                    if (continuation.value.isNullOrEmpty()) {
                        _homeListState.value = ListState.PAGINATION_EXHAUST
                    } else {
                        _homeListState.value = ListState.IDLE
                    }
                    when (chart) {
                        is Resource.Success -> {
                            _chart.value = chart.data
                        }

                        else -> {
                            _chart.value = null
                        }
                    }
                    when (newRelease) {
                        is Resource.Success -> {
                            _newRelease.value = newRelease.data ?: arrayListOf()
                        }

                        else -> {
                            _newRelease.value = arrayListOf()
                        }
                    }
                    when (exploreMoodItem) {
                        is Resource.Success -> {
                            _exploreMoodItem.value = exploreMoodItem.data
                        }

                        else -> {
                            _exploreMoodItem.value = null
                        }
                    }
                    regionCodeChart.value = dataStoreManager.chartKey.first()
                    Logger.d("HomeViewModel", "getHomeItemList: $result")
                    dataStoreManager.cookie.first().let {
                        if (it != "") {
                            _accountInfo.emit(
                                Pair(
                                    dataStoreManager.getString("AccountName").first(),
                                    dataStoreManager.getString("AccountThumbUrl").first(),
                                ),
                            )
                        }
                    }
                    when {
                        home is Resource.Error -> home.message
                        exploreMoodItem is Resource.Error -> exploreMoodItem.message
                        chart is Resource.Error -> chart.message
                        else -> null
                    }?.let {
                        showSnackBarErrorState.emit(it)
                        Logger.w("Error", "getHomeItemList: ${home.message}")
                        Logger.w("Error", "getHomeItemList: ${exploreMoodItem.message}")
                        Logger.w("Error", "getHomeItemList: ${chart.message}")
                    }
                    loading.value = false
                }
            }
    }

    fun getContinueHomeItem(continuation: String?) {
        viewModelScope.launch {
            if (continuation.isNullOrEmpty()) {
                _homeListState.value = ListState.PAGINATION_EXHAUST
                return@launch
            } else {
                log("Get more home item with continuation: $continuation")
                _homeListState.value = ListState.PAGINATING
                homeRepository
                    .getHomeDataContinue(
                        continuation,
                        getString(Res.string.view_count),
                        getString(Res.string.song),
                    ).collect { home ->
                        when (home) {
                            is Resource.Success -> {
                                _continuation.value = home.data?.first
                                val newItems = home.data?.second ?: listOf()
                                _homeItemList.update { it + newItems }
                                if (home.data?.first.isNullOrEmpty()) {
                                    _homeListState.value = ListState.PAGINATION_EXHAUST
                                } else {
                                    _homeListState.value = ListState.IDLE
                                }
                            }

                            is Resource.Error -> {
                                _continuation.value = null
                                Logger.w(tag, "getContinueHomeItem: ${home.message}")
                                showSnackBarErrorState.emit(home.message ?: "Unknown error")
                                _homeListState.value = ListState.PAGINATION_EXHAUST
                            }
                        }
                    }
            }
        }
    }

    fun exploreChart(region: String) {
        viewModelScope.launch {
            loadingChart.value = true
            homeRepository
                .getChartData(
                    region,
                ).collect { values ->
                    regionCodeChart.value = region
                    dataStoreManager.setChartKey(region)
                    when (values) {
                        is Resource.Success -> {
                            _chart.value = values.data
                        }

                        else -> {
                            _chart.value = null
                        }
                    }
                    loadingChart.value = false
                }
        }
    }

    fun setParams(params: String?) {
        _params.value = params
    }

    private var listeningRecommendationJob: Job? = null

    private fun Track.toHomeContent(): Content =
        Content(
            album = album,
            artists = artists,
            description = null,
            isExplicit = isExplicit,
            playlistId = "RDAMVM$videoId",
            browseId = null,
            thumbnails = thumbnails ?: emptyList(),
            title = title,
            videoId = videoId,
            views = null,
            durationSeconds = durationSeconds,
            videoType = videoType,
        )

    private fun injectListeningRecommendations(rawHomeItems: List<HomeItem>, params: String?) {
        if (params != null) return // Keep YouTube's mood-filtered shelves when filtering
        listeningRecommendationJob?.cancel()
        listeningRecommendationJob = viewModelScope.launch {
            try {
                val recentSongs = songRepository.getRecentSong(20, 0)
                if (recentSongs.isEmpty()) return@launch

                val quickPicksTitle = runCatching { getString(Res.string.quick_picks) }.getOrDefault("Quick picks")
                val hasQuickPicks = rawHomeItems.any {
                    it.title == quickPicksTitle || it.title.equals("Quick picks", ignoreCase = true)
                }

                val jumpBackInContents = recentSongs.map { song ->
                    song.toTrack().toHomeContent()
                }

                val jumpBackInShelf = HomeItem(
                    title = "Jump back in",
                    subtitle = "Recently played",
                    contents = jumpBackInContents,
                )

                // Pick up to 5 distinct recent songs/artists as seeds
                val seedSongs = recentSongs.distinctBy { it.artistName?.firstOrNull() ?: it.videoId }.take(5)
                val recentVideoIds = recentSongs.map { it.videoId }.toSet()

                // Fetch related tracks for all seed songs concurrently
                val relatedResults: List<List<Track>> = coroutineScope {
                    seedSongs.map { seed ->
                        async {
                            val res = songRepository.getRelatedData(seed.videoId).firstOrNull {
                                it is Resource.Success || it is Resource.Error
                            }
                            if (res is Resource.Success) {
                                res.data?.first ?: emptyList()
                            } else {
                                emptyList()
                            }
                        }
                    }.awaitAll()
                }

                // Interleave tracks from different seeds so the shelf is a diverse mix
                val maxLen = relatedResults.maxOfOrNull { it.size } ?: 0
                val recommendedTracks = mutableListOf<Track>()
                val seenVideoIds = mutableSetOf<String>()

                for (i in 0 until maxLen) {
                    for (list in relatedResults) {
                        if (i < list.size) {
                            val track = list[i]
                            if (!recentVideoIds.contains(track.videoId) && seenVideoIds.add(track.videoId)) {
                                recommendedTracks.add(track)
                            }
                        }
                    }
                }

                val recommendedContents = recommendedTracks.map { it.toHomeContent() }

                val seedArtists = seedSongs.mapNotNull { it.artistName?.firstOrNull() }.distinct().take(3)
                val subtitleText = when {
                    seedArtists.size >= 2 -> "Inspired by ${seedArtists.joinToString(", ")}"
                    seedArtists.size == 1 -> "Similar to \"${seedSongs.first().title}\""
                    else -> "Based on your recent listening"
                }

                val updatedList = buildList {
                    if (!hasQuickPicks) {
                        if (recommendedContents.isNotEmpty()) {
                            add(
                                HomeItem(
                                    title = quickPicksTitle,
                                    subtitle = subtitleText,
                                    contents = recommendedContents,
                                ),
                            )
                        } else {
                            add(
                                HomeItem(
                                    title = quickPicksTitle,
                                    subtitle = "Based on your listening",
                                    contents = jumpBackInContents,
                                ),
                            )
                        }
                    }
                    add(jumpBackInShelf)
                    addAll(rawHomeItems.filter { it.title != "Jump back in" && (hasQuickPicks || it.title != quickPicksTitle) })
                }
                _homeItemList.value = updatedList
            } catch (e: Exception) {
                Logger.e(tag, "Failed to inject personalized recommendations: ${e.message}")
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        homeJob?.cancel()
        listeningRecommendationJob?.cancel()
    }

    companion object {
        // Home params
        const val HOME_PARAMS_RELAX = "ggM8SgQIBxADSgQIBRABSgQICRABSgQIChABSgQIDRABSgQICBABSgQIBBABSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_SLEEP = "ggM8SgQIBxABSgQIBRADSgQICRABSgQIChABSgQIDRABSgQICBABSgQIBBABSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_ENERGIZE = "ggM8SgQIBxABSgQIBRABSgQICRADSgQIChABSgQIDRABSgQICBABSgQIBBABSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_SAD = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChADSgQIDRABSgQICBABSgQIBBABSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_ROMANCE = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChABSgQIDRADSgQICBABSgQIBBABSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_FEEL_GOOD = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChABSgQIDRABSgQICBADSgQIBBABSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_WORKOUT = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChABSgQIDRABSgQICBABSgQIBBADSgQIDhABSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_PARTY = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChABSgQIDRABSgQICBABSgQIBBABSgQIDhADSgQIAxABSgQIBhAB"
        const val HOME_PARAMS_COMMUTE = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChABSgQIDRABSgQICBABSgQIBBABSgQIDhABSgQIAxADSgQIBhAB"
        const val HOME_PARAMS_FOCUS = "ggM8SgQIBxABSgQIBRABSgQICRABSgQIChABSgQIDRABSgQICBABSgQIBBABSgQIDhABSgQIAxABSgQIBhAD"
    }
}