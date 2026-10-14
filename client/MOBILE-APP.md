# Install on a phone or tablet

The client can be installed as a PWA or packaged as an Android APK. Student, teacher, admin, attendance, and fee data continue to use the existing MongoDB-backed server.

## Build for your school server

1. Copy `.env.example` to `.env.production`.
2. Set `VITE_API_URL` to the public server URL ending in `/api`, for example `https://school-api.example.com/api`.
3. Build with `npm run build`.
4. Publish the contents of `dist/` on an HTTPS website. Set the server's `CLIENT_URL` to that website's origin so browser requests are allowed.

Do not use `localhost` for `VITE_API_URL` in a phone build. On a phone, `localhost` refers to the phone itself.

## Build an Android APK

The Android project is in `android/`. This workspace does not have Java or Android SDK installed, so use the included GitHub Actions workflow to build an installable debug APK:

1. Push the project to a GitHub repository.
2. In GitHub, open **Actions → Build EduManage Android APK → Run workflow**.
3. Enter the backend URL reachable by your phone, ending in `/api`. For this computer's current Wi-Fi network, the URL is `http://192.168.0.9:5000/api`. If the computer's local IP changes, use its current IPv4 address instead.
4. When the workflow finishes, download the `edumanage-android-apk` artifact, unzip it, and install `app-debug.apk` on Android.

For a local-network APK, the phone and computer must be on the same Wi-Fi, the backend must be running, and Windows Firewall must allow inbound connections to port 5000. Make sure the server's `CLIENT_URL` includes `https://localhost` (as a comma-separated origin if there are others). The APK uses HTTP to reach this local address; use a public HTTPS API for access outside the local network.

To build locally on a computer with Android Studio installed, copy `.env.android.example` to `.env.android.local`, update its URL if the computer's IP differs, then run `npm run android:sync` and build the debug APK from Android Studio.

## Install as a PWA

- **Android phone/tablet:** open the HTTPS website in Chrome, then choose **Install app** or **Add to Home screen**.
- **iPhone/iPad:** open the HTTPS website in Safari, tap **Share**, then **Add to Home Screen**.

The app shell is cached for reopening, but sign-in, attendance, fee recording, and student records need a connection to the server. The workflow builds a debug-signed APK for direct installation; publishing through Google Play requires a release signing key.
