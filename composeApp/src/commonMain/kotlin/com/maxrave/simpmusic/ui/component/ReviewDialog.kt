package com.maxrave.simpmusic.ui.component

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.window.DialogProperties
import com.maxrave.simpmusic.ui.theme.typo
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource
import simpmusic.composeapp.generated.resources.*

@Composable
@ExperimentalMaterial3Api
fun ReviewDialog(
    onDismissRequest: () -> Unit,
    onDoneReview: () -> Unit,
) {
    val uriHandler = LocalUriHandler.current
    AlertDialog(
        properties =
            DialogProperties(
                dismissOnBackPress = false,
                dismissOnClickOutside = false,
            ),
        onDismissRequest = {
            onDismissRequest.invoke()
        },
        confirmButton = {
            TextButton(onClick = {
                onDoneReview.invoke()
                uriHandler.openUri("https://github.com/jaatayushh/ayushmuzic")
            }) {
                Text(
                    stringResource(Res.string.give_a_star),
                    style = typo().bodySmall,
                )
            }
        },
        dismissButton = {
            TextButton(onClick = {
                onDismissRequest.invoke()
            }) {
                Text(
                    stringResource(Res.string.later),
                    style = typo().bodySmall,
                )
            }
        },
        icon = {
            Icon(painterResource(Res.drawable.mono), "App Icon")
        },
        title = {
            Text(
                stringResource(Res.string.enjoying_simpmusic),
                style = typo().labelSmall,
            )
        },
        text = {
            Text(
                stringResource(Res.string.if_you_enjoy_using_simpmusic_star_simpmusic_on_github_or_leave_a_review_on),
                textAlign = TextAlign.Center,
                style = typo().bodySmall,
            )
        },
    )
}