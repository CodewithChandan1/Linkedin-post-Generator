// LinkedIn OAuth 2.0 configuration and helpers.
// Uses the Community Management API (v2) for posting.

export const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID || "",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3000/api/linkedin/callback",
  scope: "openid profile w_member_social",
  authUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  userInfoUrl: "https://api.linkedin.com/v2/userinfo",
};

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CONFIG.clientId,
    redirect_uri: LINKEDIN_CONFIG.redirectUri,
    scope: LINKEDIN_CONFIG.scope,
    state: state || "linkedin_oauth",
  });
  return `${LINKEDIN_CONFIG.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: LINKEDIN_CONFIG.clientId,
    client_secret: LINKEDIN_CONFIG.clientSecret,
    redirect_uri: LINKEDIN_CONFIG.redirectUri,
  });

  const res = await fetch(LINKEDIN_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json(); // { access_token, expires_in, scope }
}

export async function getLinkedInProfile(accessToken) {
  const res = await fetch(LINKEDIN_CONFIG.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch LinkedIn profile");
  return res.json(); // { sub, name, picture, ... }
}

export async function postToLinkedIn({ accessToken, authorId, text, imageUrl }) {
  // If imageUrl is provided, upload it to LinkedIn first
  let imageAsset = null;
  if (imageUrl) {
    try {
      imageAsset = await uploadImageToLinkedIn({ accessToken, authorId, imageUrl });
    } catch {
      // Image upload failed — fall back to text-only post
    }
  }

  const shareContent = imageAsset
    ? {
        shareCommentary: { text },
        shareMediaCategory: "IMAGE",
        media: [
          {
            status: "READY",
            media: imageAsset,
            title: { text: "AI Generated Visual" },
          },
        ],
      }
    : {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      };

  const body = {
    author: `urn:li:person:${authorId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent,
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn post failed: ${err}`);
  }

  const data = await res.json();
  return { success: true, postId: data.id || "" };
}

// Step 1: Register upload with LinkedIn
async function registerImageUpload({ accessToken, authorId }) {
  const body = {
    registerUploadRequest: {
      recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
      owner: `urn:li:person:${authorId}`,
      serviceRelationships: [
        {
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        },
      ],
    },
  };

  const res = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Register upload failed: ${err}`);
  }

  const data = await res.json();
  const uploadUrl =
    data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const asset = data.value.asset;

  return { uploadUrl, asset };
}

// Step 2: Download image from Pollinations and upload binary to LinkedIn
async function uploadImageToLinkedIn({ accessToken, authorId, imageUrl }) {
  // Register the upload
  const { uploadUrl, asset } = await registerImageUpload({ accessToken, authorId });

  // Download the image from Pollinations
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("Failed to download generated image");
  const imageBuffer = await imageRes.arrayBuffer();

  // Upload to LinkedIn
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/png",
    },
    body: imageBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Image upload to LinkedIn failed: ${err}`);
  }

  return asset; // e.g., "urn:li:digitalmediaAsset:C5522AQGTYER3k3ByHQ"
}
