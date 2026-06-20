class PolyfillFileReader {
  onload = null;
  onerror = null;
  result = null;

  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((buffer) => {
        this.result = buffer;
        this.onload?.({ target: this });
      })
      .catch((err) => {
        this.onerror?.(err);
      });
  }
}

globalThis.FileReader = PolyfillFileReader;
