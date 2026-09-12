package com.maxrave.simpmusic.ui.component

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.basicMarquee
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ProgressIndicatorDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import com.maxrave.domain.data.entities.SongEntity
import com.maxrave.domain.utils.connectArtists
import com.maxrave.simpmusic.ui.icon.Pause
import com.maxrave.simpmusic.ui.icon.PlayArrow
import com.maxrave.simpmusic.ui.icon.SimpIcons
import com.maxrave.simpmusic.ui.icon.SkipNext
import com.maxrave.simpmusic.ui.icon.SkipPrevious
import com.maxrave.simpmusic.ui.theme.seed
import com.maxrave.simpmusic.ui.theme.typo
import com.maxrave.simpmusic.viewModel.SharedViewModel
import com.maxrave.simpmusic.viewModel.UIEvent
import kotlinx.coroutines.flow.collectLatest
import org.koin.compose.koinInject

/**
 * Modern Dynamic Island & Top Floating Mini-Player.
 *
 * Renders an interactive floating pill at the top of the display (hugging the camera notch/cutout).
 * Features:
 * - Real-time animated audio equalizer waveform bars.
 * - Circular album artwork thumbnail.
 * - Smooth spring-animated expansion into a quick player card with scrubber and playback controls.
 * - Gesture support: Tap to expand/collapse, Horizontal swipe for Next/Previous tracks, Long-press to open full Now Playing screen.
 */
@Composable
fun DynamicIslandPlayer(
    modifier: Modifier = Modifier,
    sharedViewModel: SharedViewModel = koinInject(),
    onOpenNowPlaying: () -> Unit,
) {
    val controllerState by sharedViewModel.controllerState.collectAsStateWithLifecycle()
    val timelineState by sharedViewModel.timeline.collectAsStateWithLifecycle()

    var songEntity by remember { mutableStateOf<SongEntity?>(null) }
    var isExpanded by remember { mutableStateOf(false) }
    var dragOffsetX by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        sharedViewModel.nowPlayingState.collectLatest { item ->
            songEntity = item?.songEntity
        }
    }

    val song = songEntity ?: return
    val isPlaying = controllerState.isPlaying

    val progress = if (timelineState.total > 0L) {
        (timelineState.current.toFloat() / timelineState.total.toFloat()).coerceIn(0f, 1f)
    } else {
        0f
    }

    val pillWidth by animateDpAsState(
        targetValue = if (isExpanded) 340.dp else 190.dp,
        animationSpec = spring(dampingRatio = 0.8f, stiffness = 400f),
        label = "pillWidth"
    )

    val pillHeight by animateDpAsState(
        targetValue = if (isExpanded) 92.dp else 38.dp,
        animationSpec = spring(dampingRatio = 0.8f, stiffness = 400f),
        label = "pillHeight"
    )

    val cornerRadius by animateDpAsState(
        targetValue = if (isExpanded) 24.dp else 19.dp,
        animationSpec = spring(dampingRatio = 0.8f, stiffness = 400f),
        label = "cornerRadius"
    )

    Box(
        modifier = modifier
            .shadow(elevation = if (isExpanded) 16.dp else 8.dp, shape = RoundedCornerShape(cornerRadius), ambientColor = Color.Black.copy(alpha = 0.6f))
            .width(pillWidth)
            .height(pillHeight)
            .clip(RoundedCornerShape(cornerRadius))
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xF0121316),
                        Color(0xF508080A),
                    )
                )
            )
            .border(
                width = 1.dp,
                color = Color.White.copy(alpha = if (isExpanded) 0.22f else 0.14f),
                shape = RoundedCornerShape(cornerRadius)
            )
            .pointerInput(Unit) {
                detectTapGestures(
                    onTap = {
                        isExpanded = !isExpanded
                    },
                    onLongPress = {
                        onOpenNowPlaying()
                    }
                )
            }
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        if (dragOffsetX > 60f) {
                            sharedViewModel.onUIEvent(UIEvent.Previous)
                        } else if (dragOffsetX < -60f) {
                            sharedViewModel.onUIEvent(UIEvent.Next)
                        }
                        dragOffsetX = 0f
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        dragOffsetX += dragAmount
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        if (!isExpanded) {
            // Collapsed Dynamic Island Pill
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left: Mini Artwork thumbnail
                AsyncImage(
                    model = song.thumbnails,
                    contentDescription = song.title,
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .border(0.5.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                    contentScale = ContentScale.Crop
                )

                Spacer(Modifier.width(6.dp))

                // Center: Scrolling Title
                Text(
                    text = song.title,
                    style = typo().bodySmall.copy(
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    ),
                    maxLines = 1,
                    modifier = Modifier
                        .weight(1f)
                        .basicMarquee()
                )

                Spacer(Modifier.width(6.dp))

                // Right: Animated live waveform visualizer
                DynamicWaveform(
                    isPlaying = isPlaying,
                    modifier = Modifier
                        .width(22.dp)
                        .height(16.dp)
                )
            }
        } else {
            // Expanded Dynamic Island Card
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Top Row: Artwork + Track Details
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AsyncImage(
                        model = song.thumbnails,
                        contentDescription = song.title,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(0.5.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )

                    Spacer(Modifier.width(10.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = song.title,
                            style = typo().bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.basicMarquee()
                        )
                        Text(
                            text = song.artistName?.connectArtists() ?: "",
                            style = typo().bodySmall.copy(
                                color = Color(0xFFAAAAAA),
                                fontSize = 11.sp
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    // Live Waveform inside expanded card
                    DynamicWaveform(
                        isPlaying = isPlaying,
                        modifier = Modifier
                            .width(24.dp)
                            .height(18.dp)
                    )
                }

                // Mini Scrubber Progress Line
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .clip(RoundedCornerShape(1.5.dp)),
                    color = seed,
                    trackColor = Color.White.copy(alpha = 0.15f),
                    strokeCap = StrokeCap.Round
                )

                // Bottom Row: Playback Transport Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { sharedViewModel.onUIEvent(UIEvent.Previous) },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = SimpIcons.SkipPrevious,
                            contentDescription = "Previous",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    IconButton(
                        onClick = { sharedViewModel.onUIEvent(UIEvent.PlayPause) },
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(seed.copy(alpha = 0.22f))
                    ) {
                        Icon(
                            imageVector = if (isPlaying) SimpIcons.Pause else SimpIcons.PlayArrow,
                            contentDescription = "Play/Pause",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    IconButton(
                        onClick = { sharedViewModel.onUIEvent(UIEvent.Next) },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = SimpIcons.SkipNext,
                            contentDescription = "Next",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * 4-bar reactive audio equalizer visualizer.
 * Pulses dynamically during playback; settles into resting bars when paused.
 */
@Composable
fun DynamicWaveform(
    isPlaying: Boolean,
    modifier: Modifier = Modifier,
    color: Color = seed,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "waveformTransition")

    val bar1 by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(420, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bar1"
    )

    val bar2 by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 0.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(310, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bar2"
    )

    val bar3 by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(480, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bar3"
    )

    val bar4 by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(360, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "bar4"
    )

    Canvas(modifier = modifier) {
        val totalWidth = size.width
        val maxHeight = size.height
        val barCount = 4
        val barWidth = 2.5.dp.toPx()
        val spacing = (totalWidth - (barWidth * barCount)) / (barCount - 1)

        val heights = if (isPlaying) {
            floatArrayOf(bar1, bar2, bar3, bar4)
        } else {
            floatArrayOf(0.3f, 0.4f, 0.35f, 0.25f)
        }

        for (i in 0 until barCount) {
            val h = heights[i] * maxHeight
            val x = i * (barWidth + spacing) + barWidth / 2f
            val top = (maxHeight - h) / 2f
            val bottom = top + h

            drawLine(
                color = color,
                start = Offset(x, top),
                end = Offset(x, bottom),
                strokeWidth = barWidth,
                cap = StrokeCap.Round
            )
        }
    }
}
