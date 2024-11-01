## [4.0.8](https://github.com/achingbrain/ssdp/compare/v4.0.7...v4.0.8) (2024-11-01)

### Bug Fixes

* update project ([8b724cd](https://github.com/achingbrain/ssdp/commit/8b724cd8d833158e4d9d4101226aef9cd524c67f))

## [4.0.7](https://github.com/achingbrain/ssdp/compare/v4.0.6...v4.0.7) (2024-11-01)

### Dependencies

* **dev:** bump aegir from 41.3.5 to 45.0.1 ([#74](https://github.com/achingbrain/ssdp/issues/74)) ([414d179](https://github.com/achingbrain/ssdp/commit/414d1799a5df0479dfdb2a2ee7f289d2da98eeb7))

## [4.0.6](https://github.com/achingbrain/ssdp/compare/v4.0.5...v4.0.6) (2023-10-18)


### Dependencies

* bump xml2js from 0.5.0 to 0.6.2 ([#52](https://github.com/achingbrain/ssdp/issues/52)) ([e87422c](https://github.com/achingbrain/ssdp/commit/e87422c1f04728adc18e5f0568ab5814986e7754))
* **dev:** bump sinon from 15.2.0 to 16.1.0 ([#59](https://github.com/achingbrain/ssdp/issues/59)) ([13241f9](https://github.com/achingbrain/ssdp/commit/13241f9fdd2de5b0034244c41558fba449a5bb35))

## [4.0.5](https://github.com/achingbrain/ssdp/compare/v4.0.4...v4.0.5) (2023-10-18)


### Dependencies

* **dev:** bump aegir from 39.0.13 to 41.0.5 ([#58](https://github.com/achingbrain/ssdp/issues/58)) ([9473fbd](https://github.com/achingbrain/ssdp/commit/9473fbd074ab43a4cf3ee057e44e634178d8a66a))

## [4.0.4](https://github.com/achingbrain/ssdp/compare/v4.0.3...v4.0.4) (2023-04-27)


### Bug Fixes

* remove uuid dependency ([#35](https://github.com/achingbrain/ssdp/issues/35)) ([4daa741](https://github.com/achingbrain/ssdp/commit/4daa7419654c15ea36ecca919e7ad2003dc5d61e))

## [4.0.3](https://github.com/achingbrain/ssdp/compare/v4.0.2...v4.0.3) (2023-04-27)


### Dependencies

* update all project deps ([#45](https://github.com/achingbrain/ssdp/issues/45)) ([f7733c5](https://github.com/achingbrain/ssdp/commit/f7733c59183cef248f0366aee430bf1d27bf295a))

## [4.0.2](https://github.com/achingbrain/ssdp/compare/v4.0.1...v4.0.2) (2023-04-27)


### Trivial Changes

* **deps:** Updated xml2js to 0.5.0 to patch CVE-2023-0842 ([#43](https://github.com/achingbrain/ssdp/issues/43)) ([fa5086f](https://github.com/achingbrain/ssdp/commit/fa5086fc7fe0fb55012c0e15ef18bfb54b54cf30)), closes [/github.com/Leonidas-from-XIV/node-xml2js/issues/663#issuecomment-1501088667](https://github.com/achingbrain//github.com/Leonidas-from-XIV/node-xml2js/issues/663/issues/issuecomment-1501088667)

### [4.0.1](https://github.com/achingbrain/ssdp/compare/v4.0.0...v4.0.1) (2022-05-26)


### Bug Fixes

* allow not starting ssdp bus ([#24](https://github.com/achingbrain/ssdp/issues/24)) ([7fe6054](https://github.com/achingbrain/ssdp/commit/7fe6054f4178fce7e8f6bfa88a305ea789ab125a))

## [4.0.0](https://github.com/achingbrain/ssdp/compare/v3.0.4...v4.0.0) (2022-05-20)


### ⚠ BREAKING CHANGES

* the `usn` constructor argument has been renamed to `udn`

### Bug Fixes

* rename usn to udn ([#23](https://github.com/achingbrain/ssdp/issues/23)) ([32c689a](https://github.com/achingbrain/ssdp/commit/32c689a0541ced5f7444edc7b28dcab84ede8f91))

### [3.0.4](https://github.com/achingbrain/ssdp/compare/v3.0.3...v3.0.4) (2022-05-20)


### Bug Fixes

* null guard on xmljs return value ([#22](https://github.com/achingbrain/ssdp/issues/22)) ([4c3778e](https://github.com/achingbrain/ssdp/commit/4c3778e3a29e25314fd808c9fb3161062aea2224))

### [3.0.3](https://github.com/achingbrain/ssdp/compare/v3.0.2...v3.0.3) (2022-02-27)


### Bug Fixes

* add location ([#14](https://github.com/achingbrain/ssdp/issues/14)) ([f9656ca](https://github.com/achingbrain/ssdp/commit/f9656ca91e72cd88cb9856b725e8ffb08dedfcb3))

### [3.0.2](https://github.com/achingbrain/ssdp/compare/v3.0.1...v3.0.2) (2022-02-26)


### Bug Fixes

* type service details ([#13](https://github.com/achingbrain/ssdp/issues/13)) ([37ce621](https://github.com/achingbrain/ssdp/commit/37ce621e7cb43c45594b9112480e85d50809f7aa))

### [3.0.1](https://github.com/achingbrain/ssdp/compare/v3.0.0...v3.0.1) (2022-02-26)


### Bug Fixes

* add location to discovered services ([#12](https://github.com/achingbrain/ssdp/issues/12)) ([c5c1528](https://github.com/achingbrain/ssdp/commit/c5c152858891d41f72ce719331d13d7d4aa780ae))

## [3.0.0](https://github.com/achingbrain/ssdp/compare/v2.1.2...v3.0.0) (2022-02-24)


### ⚠ BREAKING CHANGES

* switch to named exports, ESM only

### Features

* convert to typescript ([#10](https://github.com/achingbrain/ssdp/issues/10)) ([212473a](https://github.com/achingbrain/ssdp/commit/212473a3fb239514692fd8c5be713ec15c3453e8))
