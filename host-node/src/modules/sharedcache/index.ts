// This module remembers arbitrary data that is not needed to be on disk
// Really simple

interface SharedCacheStore {
  pendingRequests: {},
  pendingRequestTimeouts: {}
}

//@ts-ignore
let store: SharedCacheStore = {};

store.pendingRequests = {};
store.pendingRequestTimeouts = {};

export default store;
