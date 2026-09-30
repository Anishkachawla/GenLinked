// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

/**
 * 1. Cloud Function for Initial Login (linkedinAuth)
 * Exchanges a login code for a Firebase custom token.
 */
exports.linkedinAuth = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const code = req.body.code;
      if (!code) {
        return res.status(400).send("Missing authorization code.");
      }

      const clientId = functions.config().linkedin.client_id;
      const clientSecret = functions.config().linkedin.client_secret;
      
      // Redirect URI for the LOGIN flow
      const redirectUri = "http://localhost:5173/auth/linkedin/callback";

      // 1. Exchange code for an access token
      const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
      const tokenParams = new URLSearchParams();
      tokenParams.append("grant_type", "authorization_code");
      tokenParams.append("code", code);
      tokenParams.append("client_id", clientId);
      tokenParams.append("client_secret", clientSecret);
      tokenParams.append("redirect_uri", redirectUri);

      const tokenResponse = await axios.post(tokenUrl, tokenParams, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const accessToken = tokenResponse.data.access_token;

      // 2. Use access token to get user's profile
      const profileUrl = "https://api.linkedin.com/v2/userinfo";
      const profileResponse = await axios.get(profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const linkedInUser = profileResponse.data;
      const linkedInId = linkedInUser.sub;
      const email = linkedInUser.email;
      const name = linkedInUser.name;
      const picture = linkedInUser.picture;

      // 3. Create or get a Firebase user
      let userRecord;
      try {
        userRecord = await admin.auth().getUser(linkedInId);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          // No user found, create a new one
          userRecord = await admin.auth().createUser({
            uid: linkedInId, // Use LinkedIn ID as Firebase UID
            email: email,
            emailVerified: true,
            displayName: name,
            photoURL: picture,
          });
        } else {
          throw error; // Throw other user lookup errors
        }
      }

      // 4. Create a custom token for the Firebase user
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      // 5. Send the custom token back to the client
      return res.status(200).send({ token: customToken });

    } catch (error) {
      console.error("Error during LinkedIn auth:", error.response?.data || error.message);
      return res.status(500).send("Authentication failed.");
    }
  });
});


/**
 * 2. Cloud Function for Connecting API Tokens (saveLinkedInTokens)
 * Exchanges a posting code for tokens and saves them to Firestore.
 */
exports.saveLinkedInTokens = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Check if user is authenticated with Firebase
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).send("Unauthorized: Missing Firebase ID token.");
    }

    let decodedIdToken;
    try {
      decodedIdToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Error verifying Firebase ID token:", error);
      return res.status(401).send("Unauthorized: Invalid Firebase ID token.");
    }

    const firebaseUid = decodedIdToken.uid; 

    try {
      const code = req.body.code;
      if (!code) {
        return res.status(400).send("Missing authorization code.");
      }

      const clientId = functions.config().linkedin.client_id;
      const clientSecret = functions.config().linkedin.client_secret;
      
      // Redirect URI for the POSTING flow
      const redirectUri = "http://localhost:5173/auth/linkedin/connect-callback"; 

      // 1. Exchange code for access and refresh tokens
      const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
      const tokenParams = new URLSearchParams();
      tokenParams.append("grant_type", "authorization_code");
      tokenParams.append("code", code);
      tokenParams.append("client_id", clientId);
      tokenParams.append("client_secret", clientSecret);
      tokenParams.append("redirect_uri", redirectUri);

      const tokenResponse = await axios.post(tokenUrl, tokenParams, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokenResponse.data;

      // 2. Store tokens securely in a 'users' collection in Firestore
      const userRef = admin.firestore().collection("users").doc(firebaseUid);
      await userRef.set({
        linkedin: {
          accessToken: access_token,
          expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + (expires_in * 1000)),
          refreshToken: refresh_token || null,
          refreshTokenExpiresAt: refresh_token ? admin.firestore.Timestamp.fromMillis(Date.now() + (refresh_token_expires_in * 1000)) : null,
          connectedAt: admin.firestore.Timestamp.now(),
          scopes: "w_member_social" // Record the scope we got
        }
      }, { merge: true }); // Use merge to avoid overwriting other user data

      return res.status(200).send("LinkedIn tokens saved successfully.");

    } catch (error) {
      console.error("Error saving LinkedIn tokens:", error.response?.data || error.message);
      return res.status(500).send("Failed to save LinkedIn tokens.");
    }
  });
});