# Fix LOOMA Coach authentication on Android

## Goal
Stop the false “Sign in again to use the coach” error by making the app wait for the real Android session and use one verified access token source.

## Changes
- Remove the cached-profile shortcut that lets protected screens open before the secure phone session is restored.
- Keep the successful email login session immediately in the app instead of waiting for a later event.
- Add one shared access-token resolver in the authentication layer, with refresh and a short wait for native session restoration.
- Make LOOMA Coach use that resolver for every request and distinguish an expired login from a temporary loading state.
- Record the Android Coach fix in the existing release checklist.

## Verification
- Run the TypeScript check and Coach/auth tests available in the project.
- Confirm the preview build is clean.
- Validate the signed-in Coach request against the deployed function; the final Android confirmation requires a new internal-test bundle.
