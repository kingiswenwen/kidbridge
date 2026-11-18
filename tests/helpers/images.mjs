// uni-image inserts its backing <img> only after loading. An empty list of
// native images does not mean a page's illustrations have finished loading.
export async function assertImagesLoaded(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const snapshot = await page.waitForFunction(() => {
    const images = [...document.images];
    const wrappers = [...document.querySelectorAll('uni-image')];
    if (!images.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)) return false;
    if (!wrappers.every(wrapper => {
      const image = wrapper.querySelector('img');
      return image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    })) return false;
    // Check and collect in one browser turn: Vue can replace these nodes before
    // a second evaluate call, even when the previous set had finished loading.
    return images.map(image => {
      const rect = (image.closest('uni-image') || image).getBoundingClientRect();
      return {src: image.currentSrc || image.src, width: rect.width, height: rect.height};
    });
  }, undefined, {timeout: 20000}).catch(async error => {
    const images = await page.locator('uni-image, img:not(uni-image img)').evaluateAll(elements => elements.map(element => ({
      markup: element.outerHTML,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    })));
    throw new Error(`Images failed to render at ${page.url()}: ${JSON.stringify(images)}`, {cause: error});
  });
  const images = await snapshot.jsonValue();
  await snapshot.dispose();
  // Let the loaded CSS background paint before collecting visual evidence.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return images;
}
