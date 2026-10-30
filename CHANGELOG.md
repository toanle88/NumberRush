# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Add changes to
`[Unreleased]` as pull requests merge, then move them to a dated version
section before creating its tag. Group entries under **Added**, **Changed**,
**Fixed**, **Security**, or **Removed**.

## [Unreleased]

No unreleased changes.

## [1.0.2] - 2026-10-30

### Added

- Add a Settings option to keep difficulty fixed instead of increasing it
  automatically during a round. Automatic progression remains the default.
- Keep the in-round statistics within the game card on narrow mobile screens.

## [1.0.1] - 2026-10-30

### Fixed

- Add consistent spacing between progress metric cards and recurring goals.
- Remove planet-transition notifications so the answer controls never move
  during a round.
- Remove the browser focus outline from the programmatically focused results
  heading while preserving focus-based announcements.
- Remove application inline styles so the strict production CSP can apply
  without blocking UI updates.
- Render confetti on the main thread so celebrations do not require a
  blob-created worker under the strict worker CSP.

## [1.0.0] - 2026-10-30

### Added

- Initial stable release of NumberRush.

[Unreleased]: https://github.com/toanle88/NumberRush/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/toanle88/NumberRush/releases/tag/v1.0.2
[1.0.1]: https://github.com/toanle88/NumberRush/releases/tag/v1.0.1
[1.0.0]: https://github.com/toanle88/NumberRush/releases/tag/v1.0.0
