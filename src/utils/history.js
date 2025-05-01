class History {
  constructor(options) {
    const savedHistory = localStorage.getItem("history") && JSON.parse(localStorage.getItem("history"));
    this.size = options?.size ?? savedHistory?.size ?? 1000;
    this.snapshots = options?.snapshots ?? savedHistory?.snapshots ?? ["{}"];
    this.index = options?.index ?? savedHistory?.index ?? 0;
    // ENSURE NOT EXCEEDING QUOTA
    this.localStorageMaxLength = options?.localStorageMaxLength ?? 1000000;
  }

  save(obj) {
    this.snapshots.length = this.index + 1;
    const snapshot = JSON.stringify(obj);
    if (!this.matchRecent(snapshot)) {
      this.snapshots.push(snapshot);
      this.snapshots.length < this.size ? this.index++ : this.snapshots.splice(0, 1);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  toJSON() {
    return {
      snapshots: this.snapshots,
      index: this.index,
      localStorageMaxLength: this.localStorageMaxLength,
    };
  }

  saveToLocalStorage() {
    let history = JSON.stringify(this);
    if (history.length > this.localStorageMaxLength) {
      // KEEPS ONLY CURRENT STATUS IF EXCEEDING MAX
      history = JSON.stringify({
        snapshots: this.snapshots.slice(this.index, this.index + 1),
        index: 0,
        localStorageMaxLength: this.localStorageMaxLength,
      });
    }
    try {
      localStorage.setItem("history", history);
    } catch (e) {
      console.warn(e);
    }

    /*
    let snapshotStartIndex = 0;
    let snapshotEndIndex = this.snapshots.length;
    let history = JSON.stringify(this);
    while (history.length > this.localStorageMaxLength) {
      if (snapshotStartIndex < this.index) {
        snapshotStartIndex++;
      } else if (snapshotEndIndex > this.index) {
        snapshotEndIndex--;
      } else {
        history = {};
        break;
      }
      history = JSON.stringify({
        snapshots: this.snapshots.slice(snapshotStartIndex, snapshotEndIndex),
        index: this.index - snapshotStartIndex,
        localStorageMaxLength: this.localStorageMaxLength,
      });
    }
    try {
      localStorage.setItem("history", history);
    } catch (e) {
      console.warn(e);
    }
    */
  }

  matchRecent(snapshot) {
    return this.snapshots[this.index] === snapshot;
  }

  load(i = this.index) {
    if (i < 0 || i >= this.snapshots.length) {
      console.warn("attempting to load history out of bounds");
      return {};
    }
    this.saveToLocalStorage();
    return JSON.parse(this.snapshots[i]);
  }

  loadPrev() {
    if (this.index > 0) this.index--;
    return this.load();
  }

  loadNext() {
    if (this.index < this.snapshots.length - 1) this.index++;
    return this.load();
  }
}

export { History };
