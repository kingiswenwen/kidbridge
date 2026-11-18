/** Reuse an existing destination instead of stacking duplicate racing pages. */
export function returnToRacingPage(url: string) {
  const route = url.split("?")[0].replace(/^\//, "");
  const pages = getCurrentPages();
  for (let i = pages.length - 2; i >= 0; i--) {
    if (pages[i].route === route) {
      uni.navigateBack({
        delta: pages.length - 1 - i,
        fail: () => uni.redirectTo({ url }),
      });
      return;
    }
  }
  uni.redirectTo({ url });
}

/** H5 root pages do not reliably call navigateBack's failure callback. */
export function leaveRacingPage(fallback = "/pages/racing/index") {
  if (getCurrentPages().length > 1) {
    uni.navigateBack({ fail: () => uni.redirectTo({ url: fallback }) });
  } else {
    uni.redirectTo({ url: fallback });
  }
}
