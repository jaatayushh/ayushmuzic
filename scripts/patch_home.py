path = 'SimpMusic-dev/composeApp/src/commonMain/kotlin/com/maxrave/simpmusic/ui/screen/home/HomeScreen.kt'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_block_start = '                                    if (item.title == stringResource(Res.string.quick_picks)) {'
old_block_end = '                                        HomeItem(\n                                            navController = navController,\n                                            data = item,\n                                        )\n                                    }'

idx_start = text.find(old_block_start)
idx_end = text.find(old_block_end)

if idx_start == -1 or idx_end == -1:
    print('Failed to find block:', idx_start, idx_end)
    exit(1)

new_block = '''                                    if (index == 0 || item.title.equals("Quick picks", ignoreCase = true) || item.title == stringResource(Res.string.quick_picks) || item.isSongCardShelf()) {
                                        HomeDiscoverSection(
                                            data = item,
                                            navController = navController,
                                            homeViewModel = viewModel,
                                        )
                                    } else {
                                        HomeItem(
                                            navController = navController,
                                            data = item,
                                        )
                                    }'''

text = text[:idx_start] + new_block + text[idx_end + len(old_block_end):]

old_shelf = '''private fun HomeItem.isSongCardShelf(): Boolean =
    itemsPerColumn == null &&
        contents.isNotEmpty() &&
        contents.filterNotNull().let { list ->
            list.isNotEmpty() && list.none { it.thumbnails.firstOrNull()?.let { t -> t.width != t.height } == true }
        }'''

new_shelf = '''private fun HomeItem.isSongCardShelf(): Boolean =
    contents.filterNotNull().let { list ->
        list.size >= 2 && (
            title.contains("Listen again", ignoreCase = true) ||
            title.contains("Quick picks", ignoreCase = true) ||
            list.any { !it.videoId.isNullOrEmpty() }
        )
    }'''

if old_shelf not in text:
    print('Failed to find old_shelf')
    exit(1)

text = text.replace(old_shelf, new_shelf)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('HomeScreen.kt updated successfully!')
