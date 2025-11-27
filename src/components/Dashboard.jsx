import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [postContent, setPostContent] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [editingDraft, setEditingDraft] = useState(null);
  const [loading, setLoading] = useState(true);

  // LOAD DRAFTS FROM FIRESTORE (REAL-TIME)
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const draftsRef = collection(db, "drafts");
    const q = query(
      draftsRef,
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userDrafts = [];
        snapshot.forEach((doc) => {
          userDrafts.push({ id: doc.id, ...doc.data() });
        });
        setDrafts(userDrafts);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading drafts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // FIX: IMPORT GENERATED LINKEDIN POST INSTANTLY
  useEffect(() => {
    if (!currentUser) return;

    const draftFromLinkedIn = localStorage.getItem("generatedPostDraft");

    if (draftFromLinkedIn) {
      console.log("Importing LinkedIn draft instantly...");

      addDoc(collection(db, "drafts"), {
        userId: currentUser.uid,
        content: draftFromLinkedIn,
        status: "draft",
        createdAt: new Date(),
      });

      localStorage.removeItem("generatedPostDraft");

      //Show toast
      alert("LinkedIn post draft added to Dashboard!");
    }
  }, [currentUser]);

  // CREATE OR UPDATE A DRAFT
  const handleSaveDraft = async () => {
    if (postContent.trim() === "") return;

    try {
      if (editingDraft) {
        const draftRef = doc(db, "drafts", editingDraft);
        await updateDoc(draftRef, {
          content: postContent,
          updatedAt: new Date(),
        });
        console.log("Draft updated!");
      } else {
        await addDoc(collection(db, "drafts"), {
          userId: currentUser.uid,
          content: postContent,
          status: "draft",
          createdAt: new Date(),
        });
        console.log("Draft saved!");
      }

      setPostContent('');
      setEditingDraft(null);
    } catch (e) {
      console.error("Error saving draft:", e);
      alert("Error saving draft.");
    }
  };

  // LOAD A DRAFT INTO THE EDITOR
  const handleEditDraft = (draft) => {
    setPostContent(draft.content);
    setEditingDraft(draft.id);
  };

  // DELETE A DRAFT
  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;

    try {
      await deleteDoc(doc(db, "drafts", draftId));

      if (editingDraft === draftId) {
        setPostContent('');
        setEditingDraft(null);
      }
    } catch (e) {
      console.error("Error deleting draft:", e);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">

      {/* Create / Edit Post Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-10">
        <h2 className="text-3xl font-bold mb-3">
          {editingDraft ? "Edit Draft" : "Create New Post"}
        </h2>
        <p className="text-gray-500 mb-6">Share your thoughts or save them for later.</p>

        <textarea
          className="w-full h-44 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
          placeholder="What do you want to talk about?"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        />

        <div className="flex justify-end space-x-4 mt-6">
          {editingDraft && (
            <button
              onClick={() => { setEditingDraft(null); setPostContent(''); }}
              className="py-2.5 px-5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
            >
              Cancel Edit
            </button>
          )}

          <button
            onClick={handleSaveDraft}
            className="py-2.5 px-7 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-[1.03] transition"
          >
            {editingDraft ? "Update Draft" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Drafts List */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold mb-4">Your Drafts</h2>

        {loading && <p className="text-gray-500">Loading drafts...</p>}

        {!loading && drafts.length === 0 && (
          <p className="text-gray-500">You have no saved drafts.</p>
        )}

        <div className="space-y-6 mt-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="border border-gray-200 p-5 rounded-xl hover:shadow-md transition"
            >
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {draft.content}
              </p>

              <p className="text-sm text-gray-400 mt-2">
                Saved: {draft.createdAt?.toDate().toLocaleString()}
              </p>

              <div className="flex justify-end space-x-4 mt-3">
                <button
                  onClick={() => handleEditDraft(draft)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
