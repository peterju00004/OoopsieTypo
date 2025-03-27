import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import './App.css';

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraPositionRef = useRef({x: 0, z: 2})
  const animationFrameRef = useRef(null);
  const cube1Ref = useRef(null);
  const cube2Ref = useRef(null);
  const isMouseDown = useRef(false);
  const lastMousePosition = useRef({x: 0, y: 0});
  
  const cameraPositions = [
    { x: 0, z: 2 },
    { x: 2, z: 2 },
    { x: 0, z: 4 },
    { x: -2, z: 2},
  ];

  const goToNextPosition = () => {
    const nextIndex = (currentPositionIndex + 1) % cameraPositions.length;
    setCurrentPositionIndex(nextIndex);
  }

  const goToPreviousPosition = () => {
    const prevIndex = (currentPositionIndex - 1 + cameraPositions.length) % cameraPositions.length;
    setCurrentPositionIndex(prevIndex);
  }

  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const targetPosition = cameraPositions[currentPositionIndex];

    const animate = () => {
      const dx = targetPosition.x - camera.position.x;
      const dz = targetPosition.z - camera.position.z; 
      
      if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
        camera.position.x += dx * 0.1;
        camera.position.z += dz * 0.1;
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        camera.position.x = targetPosition.x;
        camera.position.z = targetPosition.z;
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentPositionIndex])

  useEffect(() => {
    const canvas = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraPositionRef.current.x, 0, cameraPositionRef.current.z);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.appendChild(renderer.domElement);

    const handleMouseDown = (e) => {
      isMouseDown.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }

    const handleMouseUp = () => {
      isMouseDown.current = false;
    }

    const handleMouseMove = (e) => {
      if (!isMouseDown.current) return;
      const deltaX = e.clientX - lastMousePosition.current.x;
      const deltaY = e.clientY - lastMousePosition.current.y;
    
      const horizontalRotation = new THREE.Matrix4().makeRotationY(deltaX * 0.005);
    
      const verticalRotation = new THREE.Matrix4();
      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();
      verticalRotation.makeRotationAxis(right, deltaY * 0.005);
    
      const lookDirection = new THREE.Vector3(0, 0, -1);
      lookDirection.applyQuaternion(camera.quaternion);
    
      lookDirection.applyMatrix4(horizontalRotation);
      
      const tempDirection = lookDirection.clone();
      tempDirection.applyMatrix4(verticalRotation);
      const angle = tempDirection.y;
      
      if (Math.abs(angle) < 0.8) {
        lookDirection.applyMatrix4(verticalRotation);
      }
    
      camera.lookAt(
        camera.position.x + lookDirection.x,
        camera.position.y + lookDirection.y,
        camera.position.z + lookDirection.z
      );
    
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);

    const geometry1 = new THREE.BoxGeometry(1, 1, 1);
    const material1 = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube1 = new THREE.Mesh(geometry1, material1);
    scene.add(cube1);
    cube1Ref.current = cube1;
  
    
    const geometry2 = new THREE.SphereGeometry( 1, 32, 16 ); 
    const material2 = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube2 = new THREE.Mesh(geometry2, material2);
    cube2.position.set(5, 0, 0);
    scene.add(cube2);
    cube2Ref.current = cube2;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleResize);

    const handleZoomIn = () => {
      camera.fov = Math.max(camera.fov - 5, 30);
      camera.updateProjectionMatrix();
    }

    const handleZoomOut = () => {
      camera.fov = Math.min(camera.fov + 5, 90);
      camera.updateProjectionMatrix();
    }

    document.getElementById('zoom-in').addEventListener('click', handleZoomIn);
    document.getElementById('zoom-out').addEventListener('click', handleZoomOut);

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      canvas.removeChild(renderer.domElement);
      geometry1.dispose();
      material1.dispose();
      geometry2.dispose();
      material2.dispose();
    };
  }, []);
  
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isDarkMode ? 0x000000 : 0xFFFFFF);
    }
    if (cube1Ref.current) {
      cube1Ref.current.material.color.set(isDarkMode ? 0x88ccff : 0x44aa88);
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!sceneRef.current || !cube1Ref.current || !cube2Ref.current) return;

    const targetX = menuOpen ? -1.5 : 0;
    const camera = cameraRef.current;

    if (camera) {
      const animate = () => {
        const dx = targetX - camera.position.x;
        if (Math.abs(dx) > 0.01) {
          camera.position.x += dx * 0.1;
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          camera.position.x = targetX;
        }
        cameraPositionRef.current.x = camera.position.x;
      }

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [menuOpen]);
  

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  }

  const handleEnterKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setMenuOpen(!menuOpen);
      e.preventDefault();
    }
  }

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)} tabIndex={0} onKeyDown={handleEnterKeyDown} role='button' aria-label='Toggle menu' aria-expanded={menuOpen}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`left-side-panel ${menuOpen ? 'open' : ''}`} >
        <nav>
          <ul>
          </ul>
        </nav>
      </div>
      
      <div id="canvas-container"></div>

      <div className={`navigation-controls ${menuOpen}`}>
        <button className="control-button" onClick={goToPreviousPosition}>←</button>
        <button className='control-button' onClick={goToNextPosition}>→</button>
      </div>

      <div className='controls'>
        <button id='zoom-in' className='control-button'>+</button>
        <button id='zoom-out' className='control-button'>-</button>
        <button onClick={toggleTheme} className='control-button'></button>
      </div>
    </div>
  );
}

export default App;