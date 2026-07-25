---
'@astrojs/cloudflare': patch
---

Fixes `/_image` returning 500 with "Can't modify immutable headers" on cache hits when `cacheCloudflare()` is enabled in dev mode
