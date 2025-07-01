import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

const AvatarContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(ellipse at center, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
`;

const PlaceholderContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 2rem;
`;

const PlaceholderAvatar = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isPlaying ? 
      'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)' : 
      'none'};
    animation: ${props => props.isPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none'};
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
  }
`;

const PlaceholderText = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  max-width: 300px;
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 5;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.state) {
      case 'speaking': return '#4ade80';
      case 'listening': return '#fbbf24';
      case 'thinking': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
  animation: ${props => props.state !== 'idle' ? 'pulse 1.5s infinite' : 'none'};
`;

function AvatarModel({ url, characterState }) {
  const group = useRef();
  const mixer = useRef();
  const idleAction = useRef(null);
  const talkAction = useRef(null);
  const morphTargetMeshRef = useRef(null);
  
  const { scene, animations } = useGLTF(url);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    if (scene && animations?.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene);
      
      // Find and set up idle animation
      const idleAnimation = animations.find(clip => 
        clip.name.toLowerCase().includes('idle') || 
        clip.name.toLowerCase().includes('breathe')
      );
      
      if (idleAnimation) {
        idleAction.current = mixer.current.clipAction(idleAnimation);
        idleAction.current.loop = THREE.LoopRepeat;
        idleAction.current.play();
        setCurrentAction(idleAction.current);
      }

      // Find and set up talk animation (but don't play it yet)
      const talkAnimation = animations.find(clip => 
        clip.name.toLowerCase().includes('talk') || 
        clip.name.toLowerCase().includes('speak')
      );
      
      if (talkAnimation) {
        talkAction.current = mixer.current.clipAction(talkAnimation);
        talkAction.current.loop = THREE.LoopRepeat;
      }

      // Find and store the specific mesh with morph targets (CC_BASE_BODY_1)
      scene.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary) {
          // Look specifically for CC_Base_Body_1 (the one with mouth morph targets)
          if (child.name === 'CC_Base_Body_1') {
            morphTargetMeshRef.current = child;
            console.log('Visemes ready: Using mesh', child.name);
          }
        }
      });
    }

    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
      }
      // Clear action references
      idleAction.current = null;
      talkAction.current = null;
    };
  }, [scene, animations]);

  useEffect(() => {
    // Handle character state changes
    if (mixer.current && idleAction.current && currentAction) {
      const { isPlaying } = characterState;
      
      if (isPlaying && talkAction.current && currentAction !== talkAction.current) {
        // Switch to talking animation
        // Stop current action cleanly before starting new one
        if (currentAction && typeof currentAction.stop === 'function') {
          currentAction.stop();
        }
        
        talkAction.current.reset();
        talkAction.current.play();
        setCurrentAction(talkAction.current);
        
      } else if (!isPlaying && currentAction !== idleAction.current) {
        // Return to idle animation
        // Stop current action cleanly before starting new one
        if (currentAction && typeof currentAction.stop === 'function') {
          currentAction.stop();
        }
        
        idleAction.current.reset();
        idleAction.current.play();
        setCurrentAction(idleAction.current);
      }
    }
  }, [characterState, currentAction]);

  // Handle visemes data for facial expressions
  useEffect(() => {
         if (morphTargetMeshRef.current && characterState.visemesData) {
       const visemesData = characterState.visemesData;
       
       // Map Convai visemes to your ARKit-style morph targets
       // Based on your morph target names starting with 'V_'
       const visemeMapping = {
         0: null,           // silence - no morph target needed
         1: 'V_Explosive',  // P, B, M - explosive/bilabial sounds
         2: 'V_Dental_Lip', // F, V - dental/lip sounds
         3: 'V_Dental_Lip', // TH - dental sounds (using same as F/V)
         4: 'V_Tight',      // T, D, N, L - tight tongue sounds
         5: 'V_Tight_O',    // K, G - back tongue sounds
         6: 'V_Affricate',  // CH, J, SH - affricate sounds
         7: 'V_Tight',      // S, Z - sibilant sounds
         8: 'V_Tight',      // N, NG - nasal sounds
         9: 'V_Lip_Open',   // R - approximant sounds
         10: 'V_Open',      // A (father) - open vowel
         11: 'V_Wide',      // E (bet) - mid vowel
         12: 'V_Tight',     // I (bit) - close vowel
         13: 'V_Tight_O',   // O (bought) - back rounded vowel
         14: 'V_Tight_O'    // U (but) - close back vowel
       };

             // Reset all V_ viseme morph targets
       Object.keys(morphTargetMeshRef.current.morphTargetDictionary).forEach(targetName => {
         if (targetName.startsWith('V_')) {
           const targetIndex = morphTargetMeshRef.current.morphTargetDictionary[targetName];
           if (morphTargetMeshRef.current.morphTargetInfluences) {
             morphTargetMeshRef.current.morphTargetInfluences[targetIndex] = 0;
           }
         }
       });

             // Apply the visemes data
       visemesData.forEach((value, index) => {
         const visemeName = visemeMapping[index];
         if (visemeName && value > 0) { // Only apply if we have a target and non-zero value
           if (morphTargetMeshRef.current.morphTargetDictionary[visemeName] !== undefined) {
             const targetIndex = morphTargetMeshRef.current.morphTargetDictionary[visemeName];
             if (morphTargetMeshRef.current.morphTargetInfluences) {
               morphTargetMeshRef.current.morphTargetInfluences[targetIndex] = Math.min(value, 1.0); // Clamp to 0-1
               console.log(`Applied viseme ${index} (${visemeName}): ${value}`);
             }
           } else {
             console.log(`Morph target not found: ${visemeName}`);
           }
         }
       });
    }
  }, [characterState.visemesData]);

  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
    
    // Add subtle head movement when speaking
    if (group.current && characterState.isPlaying) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={[1, 1, 1]} />
    </group>
  );
}

function AvatarScene({ avatarUrl, characterState }) {
  if (!avatarUrl) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 1.6, 3], fov: 50 }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Removed Environment HDR to prevent fetch errors */}
      
      <React.Suspense fallback={
        <Html center>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div>Loading Avatar...</div>
          </div>
        </Html>
      }>
        <AvatarModel url={avatarUrl} characterState={characterState} />
      </React.Suspense>
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        maxDistance={10}
        minDistance={1}
        maxPolarAngle={Math.PI / 2}
        target={[0, 1.6, 0]}
      />
    </Canvas>
  );
}

function Avatar3D({ avatarUrl, characterState }) {
  const getCharacterStatus = () => {
    if (characterState.isPlaying) return 'speaking';
    return 'idle';
  };

  const getStatusText = () => {
    if (characterState.isPlaying) return 'Speaking';
    return 'Ready';
  };

  return (
    <AvatarContainer>
      <StatusIndicator>
        <StatusDot state={getCharacterStatus()} />
        {getStatusText()}
      </StatusIndicator>
      
      {avatarUrl ? (
        <AvatarScene avatarUrl={avatarUrl} characterState={characterState} />
      ) : (
        <PlaceholderContainer>
          <PlaceholderAvatar isPlaying={characterState.isPlaying}>
            🤖
          </PlaceholderAvatar>
          <PlaceholderText>
            No 3D avatar loaded. You can provide a GLB file URL in the configuration to see your custom avatar here.
          </PlaceholderText>
        </PlaceholderContainer>
      )}
    </AvatarContainer>
  );
}

export default Avatar3D; 