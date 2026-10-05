package com.maxrave.simpmusic.telemetry

import com.maxrave.common.AppIdentity
import com.maxrave.domain.data.entities.SongEntity
import com.maxrave.domain.data.model.browse.album.Track
import com.maxrave.domain.data.model.searchResult.songs.SongsResult
import com.maxrave.domain.manager.DataStoreManager
import com.maxrave.domain.repository.AccountRepository
import com.maxrave.logger.Logger
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.random.Random

object AyushMuzicTelemetry {
    private const val TAG = "AyushMuzicTelemetry"
    private const val APP_ID = "ayushmuzic"
    private const val TELEMETRY_URL = "https://ayushflix-admin-panel.vercel.app/api/telemetry"
    private const val ERROR_URL = "https://ayushflix-admin-panel.vercel.app/api/error"

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val client by lazy {
        HttpClient(CIO) {
            engine {
                requestTimeout = 8000
            }
        }
    }

    private var dataStoreManager: DataStoreManager? = null
    private var accountRepository: AccountRepository? = null
    private var appIdentity: AppIdentity? = null
    private var cachedUserId: String? = null
    private var defaultProfileName: String = "Ayush"

    fun init(
        dataStoreManager: DataStoreManager? = null,
        accountRepository: AccountRepository? = null,
        appIdentity: AppIdentity? = null,
    ) {
        if (dataStoreManager != null) this.dataStoreManager = dataStoreManager
        if (accountRepository != null) this.accountRepository = accountRepository
        if (appIdentity != null) this.appIdentity = appIdentity
    }

    private suspend fun getUserId(): String {
        cachedUserId?.let { return it }
        val ds = dataStoreManager
        if (ds != null) {
            val saved = ds.getString("ayushmuzic_telemetry_uid").firstOrNull()
            if (!saved.isNullOrBlank()) {
                cachedUserId = saved
                return saved
            }
            val newId = generateId()
            ds.putString("ayushmuzic_telemetry_uid", newId)
            cachedUserId = newId
            return newId
        }
        val gen = generateId()
        cachedUserId = gen
        return gen
    }

    private suspend fun getProfileName(): String {
        try {
            val user = accountRepository?.getUsedGoogleAccount()?.firstOrNull()
            if (user != null && !user.name.isNullOrBlank()) {
                return user.name
            }
        } catch (_: Throwable) {}
        return defaultProfileName
    }

    private fun getPlatformName(): String {
        val platformStr = appIdentity?.platform ?: "Android"
        return if (platformStr.contains("Android", ignoreCase = true)) "Android" else platformStr
    }

    private fun generateId(): String {
        val chars = "abcdefghijklmnopqrstuvwxyz0123456789"
        val part1 = (1..8).map { chars[Random.nextInt(chars.length)] }.joinToString("")
        val part2 = (1..6).map { chars[Random.nextInt(chars.length)] }.joinToString("")
        return "${part1}_${part2}"
    }

    fun trackProgress(
        title: String?,
        artist: String?,
        progressSec: Long,
        durationSec: Long,
        status: String, // "playing", "completed", "paused"
    ) {
        val trackTitle = title?.takeIf { it.isNotBlank() } ?: return
        val trackArtist = artist ?: ""
        val safeDuration = if (durationSec > 0) durationSec else 1L
        val clampedProgress = progressSec.coerceAtLeast(0L).coerceAtMost(safeDuration)
        val percentage = ((clampedProgress.toDouble() / safeDuration.toDouble()) * 100.0)
            .toInt()
            .coerceIn(0, 100)

        scope.launch {
            runCatching {
                val userId = getUserId()
                val profileName = getProfileName()
                val platform = getPlatformName()

                val json = buildJsonObject {
                    put("appId", APP_ID)
                    put("eventType", "watch_progress")
                    put("title", trackTitle)
                    put("artist", trackArtist)
                    put("progress", clampedProgress)
                    put("duration", safeDuration)
                    put("percentage", percentage)
                    put("platform", platform)
                    put("status", status)
                    put("profileName", profileName)
                    put("userId", userId)
                }

                client.post(TELEMETRY_URL) {
                    contentType(ContentType.Application.Json)
                    setBody(json.toString())
                }
            }.onFailure {
                Logger.d(TAG, "trackProgress silent fail: ${it.message}")
            }
        }
    }

    fun trackSearch(query: String) {
        val q = query.trim()
        if (q.isEmpty()) return

        scope.launch {
            runCatching {
                val userId = getUserId()
                val profileName = getProfileName()
                val platform = getPlatformName()

                val json = buildJsonObject {
                    put("appId", APP_ID)
                    put("eventType", "search")
                    put("query", q)
                    put("title", q)
                    put("profileName", profileName)
                    put("platform", platform)
                    put("userId", userId)
                }

                client.post(TELEMETRY_URL) {
                    contentType(ContentType.Application.Json)
                    setBody(json.toString())
                }
            }.onFailure {
                Logger.d(TAG, "trackSearch silent fail: ${it.message}")
            }
        }
    }

    fun <T> trackClick(item: T) {
        val (title, artist) = when (item) {
            is SongEntity -> item.title to (item.artistName?.joinToString(", ") ?: "")
            is Track -> item.title to (item.artists?.joinToString(", ") { it.name } ?: "")
            is SongsResult -> item.title to (item.artists?.joinToString(", ") { it.name } ?: "")
            else -> return
        }

        if (title.isNullOrBlank()) return

        scope.launch {
            runCatching {
                val userId = getUserId()
                val profileName = getProfileName()
                val platform = getPlatformName()

                val json = buildJsonObject {
                    put("appId", APP_ID)
                    put("eventType", "click")
                    put("title", title)
                    put("artist", artist)
                    put("profileName", profileName)
                    put("platform", platform)
                    put("userId", userId)
                }

                client.post(TELEMETRY_URL) {
                    contentType(ContentType.Application.Json)
                    setBody(json.toString())
                }
            }.onFailure {
                Logger.d(TAG, "trackClick silent fail: ${it.message}")
            }
        }
    }

    fun reportError(
        throwable: Throwable,
        sourceFile: String = "AudioPlayerService.kt",
    ) {
        scope.launch {
            runCatching {
                val profileName = getProfileName()
                val platform = getPlatformName()
                val errMsg = throwable.localizedMessage ?: throwable.message ?: "Unknown error"
                val stack = throwable.stackTraceToString()

                val json = buildJsonObject {
                    put("appId", APP_ID)
                    put("errorMessage", errMsg)
                    put("stackTrace", stack)
                    put("sourceFile", sourceFile)
                    put("profileName", profileName)
                    put("platform", platform)
                }

                client.post(ERROR_URL) {
                    contentType(ContentType.Application.Json)
                    setBody(json.toString())
                }
            }.onFailure {
                Logger.d(TAG, "reportError silent fail: ${it.message}")
            }
        }
    }

    fun reportPlayerError(
        errorMessage: String,
        stackTrace: String = "",
        sourceFile: String = "SimpleMediaService.kt",
    ) {
        scope.launch {
            runCatching {
                val profileName = getProfileName()
                val platform = getPlatformName()

                val json = buildJsonObject {
                    put("appId", APP_ID)
                    put("errorMessage", errorMessage)
                    put("stackTrace", stackTrace)
                    put("sourceFile", sourceFile)
                    put("profileName", profileName)
                    put("platform", platform)
                }

                client.post(ERROR_URL) {
                    contentType(ContentType.Application.Json)
                    setBody(json.toString())
                }
            }.onFailure {
                Logger.d(TAG, "reportPlayerError silent fail: ${it.message}")
            }
        }
    }
}
