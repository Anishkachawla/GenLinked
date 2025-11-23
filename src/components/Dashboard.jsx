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
    <div className="container mx-auto p-6 max-w-5xl">

      {/* Create Post Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-10">
        <h2 className="text-3xl font-bold mb-3 tracking-tight">
          {editingDraft ? "Edit Draft" : "Create New Post"}
        </h2>
        <p className="text-gray-500 mb-6">
          Share your thoughts or save them for later.
        </p>

        <textarea
          className="w-full h-44 p-4 border border-gray-300 rounded-xl 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    transition-all duration-300 resize-none"
          placeholder="What do you want to talk about?"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        ></textarea>

        <div className="flex justify-end space-x-4 mt-6">
          {editingDraft && (
            <button
              onClick={() => { setEditingDraft(null); setPostContent(''); }}
              className="py-2.5 px-5 bg-gray-600 text-white rounded-xl 
                        hover:bg-gray-700 transition-all"
            >
              Cancel Edit
            </button>
          )}

          <button
            onClick={handleSaveDraft}
            className="py-2.5 px-7 bg-gradient-to-r from-blue-600 to-purple-600 
                      text-white rounded-xl font-medium shadow-md 
                      hover:shadow-lg hover:scale-[1.03] transition-all"
          >
            {editingDraft ? "Update Draft" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Drafts Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold mb-4 tracking-tight">Your Drafts</h2>

        {loading && <p className="text-gray-500">Loading drafts...</p>}
        {!loading && drafts.length === 0 && (
          <p className="text-gray-500">You have no saved drafts.</p>
        )}

        <div className="space-y-6 mt-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="border border-gray-200 p-5 rounded-xl hover:shadow-md 
                        transition-all bg-white"
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
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="text-sm text-red-600 font-medium hover:underline"
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
