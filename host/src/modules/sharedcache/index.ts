// This module remembers arbitrary data that is not needed to be on disk
// Really simple

interface SharedCacheStore {
  pendingRequests: {}
}

//@ts-ignore
let store: SharedCacheStore = {};

export default store;
