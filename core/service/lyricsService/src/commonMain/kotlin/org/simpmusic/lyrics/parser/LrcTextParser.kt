package org.simpmusic.lyrics.parser

import com.maxrave.domain.extension.decodeHtmlEntities
import org.simpmusic.lyrics.domain.Lyrics

fun parseSyncedLyrics(data: String): Lyrics {
    val regex = Regex("\\[(\\d{2}):(\\d{2})\\.(\\d{2})\\](.+)")
    val lines = data.lines()
    val linesLyrics = ArrayList<Lyrics.LyricsX.Line>()
    lines.map { line ->
        val matchResult = regex.matchEntire(line)
        if (matchResult != null) {
            val minutes = matchResult.groupValues[1].toLong()
            val seconds = matchResult.groupValues[2].toLong()
            val milliseconds = matchResult.groupValues[3].toLong()
            val timeInMillis = minutes * 60_000L + seconds * 1000L + milliseconds
            // Trim, don't drop a fixed first character. Most providers leave a space after
            // "]", but LRCLIB packs the text right against it — "[00:27.12]boy, you got me"
            // — so removeRange(0, 1) ate the first letter of every single line.
            val rawContent = matchResult.groupValues[4]
            val content = if (rawContent.isBlank()) "♫" else rawContent.trimStart()
            linesLyrics.add(
                Lyrics.LyricsX.Line(
                    endTimeMs = "0",
                    startTimeMs = timeInMillis.toString(),
                    syllables = listOf(),
                    words = decodeHtmlEntities(content),
                ),
            )
        }
    }
    return Lyrics(
        lyrics =
            Lyrics.LyricsX(
                lines = linesLyrics,
                syncType = "LINE_SYNCED",
            ),
    )
}

fun parseRichSyncLyrics(data: String): Lyrics {
    // Unescape JSON string if needed (remove quotes and replace \n with actual newlines)
    val unescapedData =
        data
            .trim()
            .removePrefix("\"")
            .removeSuffix("\"")
            .replace("\\\\", "\\")
            .replace("\\n", "\n")
            .replace("\\r", "\r")
            .replace("\\t", "\t")

    // Handle different line separators (Unix \n, Windows \r\n, Mac \r)
    val lines = unescapedData.lines()
    // Skip offset line if present (starts with [offset:)
    val lyricsLines =
        lines.filter { line ->
            line.isNotBlank() && !line.trim().startsWith("[offset:")
        }

    println("[parseRichSyncLyrics] Total lines: ${lines.size}, Filtered lines: ${lyricsLines.size}")
    if (lyricsLines.isNotEmpty()) {
        println("[parseRichSyncLyrics] First line sample: ${lyricsLines.first()}")
    }

    // Regex to match [MM:SS.mm] format (flexible with 1-2 digits)
    val regex = Regex("\\[(\\d{1,2}):(\\d{2})\\.(\\d{2,3})\\](.+)")
    // Strip a leading voice marker (e.g. "v1:", "v2:") that some lyrics
    // providers prepend before the first word timestamp, so it doesn't leak
    // into the word content and stick to the first word.
    val voiceMarkerRegex = Regex("""^v\d+:""")
    val linesLyrics = ArrayList<Lyrics.LyricsX.Line>()

    lyricsLines.forEachIndexed { index, line ->
        val matchResult = regex.matchEntire(line.trim())
        if (matchResult != null) {
            val minutes = matchResult.groupValues[1].toLongOrNull() ?: 0L
            val seconds = matchResult.groupValues[2].toLongOrNull() ?: 0L
            val centiseconds = matchResult.groupValues[3].toLongOrNull() ?: 0L

            // Convert to milliseconds
            // If centiseconds has 3 digits (milliseconds), use directly
            // If 2 digits (centiseconds), multiply by 10
            val millisPart = if (matchResult.groupValues[3].length == 3) centiseconds else centiseconds * 10
            val timeInMillis = minutes * 60_000L + seconds * 1000L + millisPart

            // Keep the rich sync content as-is (with <MM:SS.mm> word format)
            val content =
                matchResult.groupValues[4]
                    .trimStart()
                    .replace(voiceMarkerRegex, "")
                    .trimStart()

            if (content.isNotBlank()) {
                linesLyrics.add(
                    Lyrics.LyricsX.Line(
                        endTimeMs = "0",
                        startTimeMs = timeInMillis.toString(),
                        syllables = listOf(),
                        words = content,
                    ),
                )
            }
        } else {
            if (index < 3) { // Only log first 3 failed matches to avoid spam
                println("[parseRichSyncLyrics] Line $index failed to match: '${line.take(100)}'")
            }
        }
    }

    println("[parseRichSyncLyrics] Parsed ${linesLyrics.size} lines successfully")

    return Lyrics(
        lyrics =
            Lyrics.LyricsX(
                lines = linesLyrics,
                syncType = "RICH_SYNCED",
            ),
    )
}

/**
 * Parse TTML (Timed Text Markup Language) lyrics from BetterLyrics.
 * Supports both line-synced and word-by-word synced lyrics.
 *
 * TTML format: `<p begin="M:SS.mmm" end="M:SS.mmm">` contains `<span begin="..." end="...">word</span>`
 * If spans with timing exist → word-by-word (RICH_SYNCED)
 * If no spans → line-synced (LINE_SYNCED)
 */
fun parseTtmlLyrics(data: String): Lyrics {
    val linesLyrics = ArrayList<Lyrics.LyricsX.Line>()
    var hasWordTiming = false

    // Clean data: remove translation / romanization / phonetic div blocks
    val cleanData =
        data
            .replace(Regex("""<div\s[^>]*ttm:role=["']x-(roman|translation|phonetic)["'][^>]*>[\s\S]*?</div>""", RegexOption.IGNORE_CASE), "")
            .replace(Regex("""<div\s[^>]*xml:lang=["'][a-zA-Z0-9_-]+-Latn["'][^>]*>[\s\S]*?</div>""", RegexOption.IGNORE_CASE), "")

    // Match each <p ...>...</p> element
    val pRegex = Regex("""<p\s([^>]*)begin="([^"]+)"[^>]*end="([^"]+)"([^>]*)>([\s\S]*?)</p>""", RegexOption.IGNORE_CASE)
    // Match leaf <span ...>word</span> elements that do not contain other tags
    val leafSpanRegex = Regex("""<span\s([^>]*)begin="([^"]+)"[^>]*end="([^"]+)"([^>]*)>([^<]+)</span>""", RegexOption.IGNORE_CASE)

    for (pMatch in pRegex.findAll(cleanData)) {
        val pAttrs = (pMatch.groupValues[1] + " " + pMatch.groupValues[4]).lowercase()
        // Skip romanized, translated, or phonetic companion lines
        if (pAttrs.contains("""ttm:role="x-roman"""") || pAttrs.contains("""ttm:role='x-roman'""") ||
            pAttrs.contains("""ttm:role="x-translation"""") || pAttrs.contains("""ttm:role='x-translation'""") ||
            pAttrs.contains("""ttm:role="x-phonetic"""") || pAttrs.contains("""ttm:role='x-phonetic'""") ||
            (pAttrs.contains("xml:lang") && pAttrs.contains("-latn"))
        ) {
            continue
        }

        val lineBegin = parseTtmlTime(pMatch.groupValues[2])
        val lineEnd = parseTtmlTime(pMatch.groupValues[3])
        var innerContent = pMatch.groupValues[5]

        // Strip ruby rt annotations (<rt>...</rt>)
        innerContent = innerContent.replace(Regex("""<rt[^>]*>[\s\S]*?</rt>""", RegexOption.IGNORE_CASE), "")

        // Strip inline romanization, translation, or phonetic spans so they never mix into primary words
        innerContent =
            innerContent
                .replace(Regex("""<span\s[^>]*ttm:role=["']x-(roman|translation|phonetic)["'][^>]*>[\s\S]*?</span>""", RegexOption.IGNORE_CASE), "")
                .replace(Regex("""<span\s[^>]*xml:lang=["'][a-zA-Z0-9_-]+-Latn["'][^>]*>[\s\S]*?</span>""", RegexOption.IGNORE_CASE), "")

        val leafSpans = leafSpanRegex.findAll(innerContent).toList()

        // Extract valid leaf words
        val validWords = mutableListOf<Pair<Long, String>>()
        for (span in leafSpans) {
            val spanAttrs = (span.groupValues[1] + " " + span.groupValues[4]).lowercase()
            if (spanAttrs.contains("""ttm:role="x-""") || spanAttrs.contains("""ttm:role='x-""") || spanAttrs.contains("-latn")) {
                continue
            }
            val text = decodeHtmlEntities(span.groupValues[5].replace(Regex("<[^>]*>"), "")).trim()
            if (text.isNotEmpty()) {
                val spanBegin = parseTtmlTime(span.groupValues[2])
                validWords.add(spanBegin to text)
            }
        }

        if (validWords.isNotEmpty()) {
            hasWordTiming = true
            // Build word-by-word content with <MM:SS.mm> timing format for rich sync
            val wordParts = StringBuilder()
            for ((spanBegin, word) in validWords) {
                val beginFormatted = formatMsToLrc(spanBegin)
                wordParts.append("<$beginFormatted>$word ")
            }
            val words = wordParts.toString().trimEnd()
            if (words.isNotBlank()) {
                linesLyrics.add(
                    Lyrics.LyricsX.Line(
                        startTimeMs = lineBegin.toString(),
                        endTimeMs = lineEnd.toString(),
                        syllables = listOf(),
                        words = words,
                    ),
                )
            }
        } else {
            // No leaf spans — extract plain text (strip any remaining tags)
            val plainText = decodeHtmlEntities(innerContent.replace(Regex("<[^>]*>"), "")).trim()
            if (plainText.isNotBlank()) {
                linesLyrics.add(
                    Lyrics.LyricsX.Line(
                        startTimeMs = lineBegin.toString(),
                        endTimeMs = lineEnd.toString(),
                        syllables = listOf(),
                        words = plainText,
                    ),
                )
            }
        }
    }

    return Lyrics(
        lyrics =
            Lyrics.LyricsX(
                lines = linesLyrics,
                syncType = if (hasWordTiming) "RICH_SYNCED" else "LINE_SYNCED",
            ),
    )
}

/**
 * Parse TTML time format to milliseconds.
 * Supports: "M:SS.mmm", "MM:SS.mmm", "H:MM:SS.mmm", "SS.mmm"
 */
private fun parseTtmlTime(time: String): Long {
    val parts = time.split(":")
    return when (parts.size) {
        3 -> {
            val hours = parts[0].toLongOrNull() ?: 0L
            val minutes = parts[1].toLongOrNull() ?: 0L
            val secParts = parts[2].split(".")
            val seconds = secParts[0].toLongOrNull() ?: 0L
            val millis = parseMillisPart(secParts.getOrNull(1))
            hours * 3_600_000L + minutes * 60_000L + seconds * 1000L + millis
        }
        2 -> {
            val minutes = parts[0].toLongOrNull() ?: 0L
            val secParts = parts[1].split(".")
            val seconds = secParts[0].toLongOrNull() ?: 0L
            val millis = parseMillisPart(secParts.getOrNull(1))
            minutes * 60_000L + seconds * 1000L + millis
        }
        else -> {
            val secParts = time.split(".")
            val seconds = secParts[0].toLongOrNull() ?: 0L
            val millis = parseMillisPart(secParts.getOrNull(1))
            seconds * 1000L + millis
        }
    }
}

private fun parseMillisPart(part: String?): Long {
    if (part.isNullOrEmpty()) return 0L
    val value = part.toLongOrNull() ?: return 0L
    return when (part.length) {
        1 -> value * 100
        2 -> value * 10
        3 -> value
        else -> value
    }
}

private fun formatMsToLrc(ms: Long): String {
    val minutes = ms / 60_000L
    val seconds = (ms % 60_000L) / 1000L
    val centis = (ms % 1000L) / 10L
    val m = if (minutes < 10) "0$minutes" else "$minutes"
    val s = if (seconds < 10) "0$seconds" else "$seconds"
    val c = if (centis < 10) "0$centis" else "$centis"
    return "$m:$s.$c"
}

fun parseUnsyncedLyrics(data: String): Lyrics {
    val lines = data.lines()
    val linesLyrics = ArrayList<Lyrics.LyricsX.Line>()
    lines.map { line ->
        linesLyrics.add(
            Lyrics.LyricsX.Line(
                endTimeMs = "0",
                startTimeMs = "0",
                syllables = listOf(),
                words = line,
            ),
        )
    }
    return Lyrics(
        lyrics =
            Lyrics.LyricsX(
                lines = linesLyrics,
                syncType = "UNSYNCED",
            ),
    )
}