# Upgrading

## 2.0 to 3.0

@achingbrain/ssdp is now ESM-only and no longer supports wildcard events.  The discovery method returns an async
iterator of discovered services.

## 1.0 to 2.0

@achingbrain/ssdp moved from a callback model to a promises based model.  All other arguments remained the same.

### Before

```javascript
bus.advertise({
  // ...
}, (error, advert) => {

  advert.service.details((error, details) => {

  })
})
```

### After

```javascript
bus.advertise({
  // ...
})
.then(advert => {

  advert.service.details()
  .then(details => {

  })
  .catch(error => {

  })
})
.catch(error => {

})
```
