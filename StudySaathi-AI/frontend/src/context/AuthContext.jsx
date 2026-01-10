import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const lastUidRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      
      // Skip if we're already fetching for the same user
      if (fetchingRef.current && lastUidRef.current === firebaseUser?.uid) {
        console.log('Skipping duplicate fetch for same user');
        return;
      }
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Skip if same user
        if (lastUidRef.current === firebaseUser.uid && userProfile !== undefined) {
          console.log('Same user, skipping profile fetch');
          setLoading(false);
          return;
        }
        
        fetchingRef.current = true;
        lastUidRef.current = firebaseUser.uid;
        
        try {
          console.log('Fetching user profile for:', firebaseUser.uid);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => {
              reject(new Error('Firestore timeout'));
            }, 8000)
          );
          
          const fetchPromise = getDoc(userDocRef);
          
          const userDoc = await Promise.race([fetchPromise, timeoutPromise]);
          console.log('Profile fetch complete, exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            console.log('No profile found - user needs onboarding');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error.message);
          setUserProfile(null);
        } finally {
          fetchingRef.current = false;
        }
      } else {
        lastUidRef.current = null;
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
    hasCompletedOnboarding: userProfile?.onboardingCompleted || false,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
