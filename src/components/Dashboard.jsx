<<<<<<< HEAD
import React from 'react'

const Dashboard = () => {
  return (
    <div>
      My Dashboard
    </div>
  )
}

export default Dashboard
=======
// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase'; // Import Firestore
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
  const [drafts, setDrafts] = useState([]); // To store drafts from Firestore
  const [editingDraft, setEditingDraft] = useState(null); // To hold the ID of the draft being edited
  const [loading, setLoading] = useState(true);

  // --- Read drafts from Firestore ---
  useEffect(() => {
    if (!currentUser) return; // Don't run if user is not logged in

    setLoading(true);
    // Create a query to get drafts for the current user, ordered by creation time
    const draftsRef = collection(db, "drafts");
    const q = query(
      draftsRef, 
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    // onSnapshot listens for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userDrafts = [];
      querySnapshot.forEach((doc) => {
        userDrafts.push({ id: doc.id, ...doc.data() });
      });
      setDrafts(userDrafts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching drafts: ", error);
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [currentUser]); // Re-run if the user changes

  // --- Create or Update a draft ---
  const handleSaveDraft = async () => { // <-- ERROR WAS HERE
    if (postContent.trim() === "") return; // Don't save empty drafts

    try {
      if (editingDraft) {
        // --- Update existing draft ---
        const draftRef = doc(db, "drafts", editingDraft);
        await updateDoc(draftRef, {
          content: postContent,
          updatedAt: new Date()
        });
        console.log("Draft updated!");
      } else {
        // --- Create new draft ---
        await addDoc(collection(db, "drafts"), {
          userId: currentUser.uid,
          content: postContent,
          status: "draft", // 'draft', 'scheduled', 'published'
          createdAt: new Date(),
        });
        console.log("Draft saved!");
      }
      
      // Clear the editor
      setPostContent('');
      setEditingDraft(null);

    } catch (e) {
      console.error("Error saving draft: ", e);
      alert("Error saving draft. Check console for details.");
    }
  };

  // --- Load a draft into the editor ---
  const handleEditDraft = (draft) => {
    setPostContent(draft.content);
    setEditingDraft(draft.id);
  };
  
  // --- Delete a draft ---
  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;
    
    try {
      await deleteDoc(doc(db, "drafts", draftId));
      console.log("Draft deleted!");
      if (editingDraft === draftId) {
        setPostContent('');
        setEditingDraft(null);
      }
    } catch (e) {
      console.error("Error deleting draft: ", e);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingDraft ? "Edit Draft" : "Create New Post"}
        </h2>
        <textarea
          className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="What do you want to talk about?"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        ></textarea>
        <div className="flex justify-end space-x-4 mt-4">
          {editingDraft && (
            <button
              onClick={() => { setEditingDraft(null); setPostContent(''); }}
              className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel Edit
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            className="py-2 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            {editingDraft ? "Update Draft" : "Save Draft"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Your Drafts</h2>
        {loading && <p>Loading drafts...</p>}
        {!loading && drafts.length === 0 && <p>You have no saved drafts.</p>}
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="border border-gray-200 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{draft.content}</p>
              <p className="text-sm text-gray-400 mt-2">
                Saved: {draft.createdAt.toDate().toLocaleString()}
              </p>
              <div className="flex justify-end space-x-2 mt-2">
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
>>>>>>> 6b7fac3d94f4d5d2ff3e45fb17a16b8e0cc0edc7
