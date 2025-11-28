import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";

const Dashboard = () => {
  const { currentUser } = useAuth();

  const [postContent, setPostContent] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [editingDraft, setEditingDraft] = useState(null);
  const [loading, setLoading] = useState(true);

  const [linkedinConnected, setLinkedInConnected] = useState(false);
  const [checkingLinkedInStatus, setCheckingLinkedInStatus] = useState(true);

  //  1. Load Drafts (REALTIME)
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const draftsRef = collection(db, "drafts");
    const q = query(
      draftsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userDrafts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDrafts(userDrafts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const generatedDraft = localStorage.getItem("generatedPostDraft");

    if (generatedDraft) {
      console.log("Importing LinkedIn-generated draft...");

      addDoc(collection(db, "drafts"), {
        userId: currentUser.uid,
        content: generatedDraft,
        status: "draft",
        createdAt: new Date(),
      });

      // remove so it doesn't import twice
      localStorage.removeItem("generatedPostDraft");

      alert("LinkedIn-style draft added to your Dashboard!");
    }
  }, [currentUser]);

  
  //  2. Check LinkedIn Token in Firestore
  useEffect(() => {
    if (!currentUser) return;

    const check = async () => {
      setCheckingLinkedInStatus(true);

      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().linkedin?.accessToken) {
          setLinkedInConnected(true);
        } else {
          setLinkedInConnected(false);
        }
      } catch {
        setLinkedInConnected(false);
      }

      setCheckingLinkedInStatus(false);
    };

    check();
  }, [currentUser]);

  
  //  3. Save Draft
  const handleSaveDraft = async () => {
    if (!postContent.trim()) return;

    setLoading(true);
    try {
      if (editingDraft) {
        await updateDoc(doc(db, "drafts", editingDraft), {
          content: postContent,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, "drafts"), {
          userId: currentUser.uid,
          content: postContent,
          status: "draft",
          createdAt: new Date(),
        });
      }

      setPostContent("");
      setEditingDraft(null);
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Error saving draft.");
    }

    setLoading(false);
  };

  
  //  4. Publish to LinkedIn (GEN-2 HTTP API)
  const handlePublish = async () => {
    if (!postContent.trim()) return alert("Content empty.");
    if (!linkedinConnected) return alert("Connect LinkedIn first.");
    if (!window.confirm("Publish this post on LinkedIn?")) return;

    setLoading(true);

    try {
      // A) Save the draft first
      let draftId = editingDraft;

      if (editingDraft) {
        await updateDoc(doc(db, "drafts", editingDraft), {
          content: postContent,
          updatedAt: new Date(),
        });
      } else {
        const ref = await addDoc(collection(db, "drafts"), {
          userId: currentUser.uid,
          content: postContent,
          status: "draft",
          createdAt: new Date(),
        });
        draftId = ref.id;
      }

      // B) Call GEN-2 LinkedIn publish endpoint
      const idToken = await currentUser.getIdToken();

      const response = await fetch(
        "https://us-central1-agentic-ai-58b57.cloudfunctions.net/api/publishPost",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: postContent }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Publish failed:", result);
        alert("Failed to publish. Check console.");
        setLoading(false);
        return;
      }

      // C) Update Firestore
      await updateDoc(doc(db, "drafts", draftId), {
        status: "published",
        linkedinPostId: result.id || null,
        publishedAt: new Date(),
      });

      alert("🎉 Successfully posted to LinkedIn!");
      setPostContent("");
      setEditingDraft(null);
    } catch (err) {
      console.error("Publish error:", err);
      alert("Publish failed.");
    }

    setLoading(false);
  };

  
  //  5. Connect LinkedIn
  const handleConnectLinkedIn = () => {
    const CLIENT_ID = "86fl92ig4lm11e";
    const REDIRECT_URI =
      "http://localhost:5173/auth/linkedin/connect-callback";
    const SCOPE = "openid profile email w_member_social";

    const url =
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPE)}`;

    window.location.href = url;
  };

  
  // UI
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* LinkedIn Section */}
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-4">LinkedIn Integration</h2>

        {checkingLinkedInStatus ? (
          <p className="text-gray-500 animate-pulse">Checking LinkedIn...</p>
        ) : linkedinConnected ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-600 flex items-center">
            <strong>✓ LinkedIn Connected!</strong>
          </div>
        ) : (
          <button
            className="py-3 px-6 bg-[#0077b5] hover:bg-[#006097] text-white font-bold rounded-lg"
            onClick={handleConnectLinkedIn}
          >
            Connect LinkedIn
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingDraft ? "Edit Draft" : "Create New Post"}
        </h2>

        <textarea
          className="w-full h-40 p-3 border rounded-lg resize-none"
          disabled={loading}
          value={postContent}
          placeholder="What do you want to talk about?"
          onChange={(e) => setPostContent(e.target.value)}
        />

        <div className="flex justify-end gap-4 mt-4">
          {editingDraft && (
            <button
              className="py-2 px-4 bg-gray-500 text-white rounded-lg"
              onClick={() => {
                setEditingDraft(null);
                setPostContent("");
              }}
            >
              Cancel Edit
            </button>
          )}

          <button
            className={`py-2 px-6 font-bold rounded-lg ${
              loading || !linkedinConnected
                ? "bg-gray-400"
                : "bg-[#0077b5] hover:bg-[#006097] text-white"
            }`}
            onClick={handlePublish}
            disabled={!linkedinConnected || loading}
          >
            Publish
          </button>

          <button
            className="py-2 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
            onClick={handleSaveDraft}
            disabled={loading}
          >
            {editingDraft ? "Update Draft" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Draft List */}
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Your Drafts</h2>

        {!loading && drafts.length === 0 && (
          <p className="text-gray-500">No drafts yet.</p>
        )}

        {drafts.map((draft) => (
          <div
            key={draft.id}
            className={`border p-4 rounded-lg mb-3 ${
              draft.status === "published"
                ? "bg-green-50 border-green-200"
                : "hover:border-blue-300 border-gray-200"
            }`}
          >
            <p className="text-gray-800 whitespace-pre-wrap">
              {draft.content}
            </p>

            <div className="flex justify-between items-center mt-3 border-t pt-2">
              <p className="text-sm text-gray-400">
                {draft.createdAt?.toDate().toLocaleString()}
              </p>

              <div className="flex gap-3">
                {draft.status !== "published" && (
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditingDraft(draft.id);
                      setPostContent(draft.content);
                    }}
                  >
                    Edit
                  </button>
                )}

                <button
                  className="text-red-600"
                  onClick={() => deleteDoc(doc(db, "drafts", draft.id))}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;