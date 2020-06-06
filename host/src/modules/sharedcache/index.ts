// This module remembers arbitrary data that is not needed to be on disk
// Really simple

interface SharedCacheStore {
  pendingRequests: {}
}

let store: SharedCacheStore;

export default store;
