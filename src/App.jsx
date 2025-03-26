import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const sceneRef = useRef(null);
  const cubeRef = useRef(null);

  useEffect(() => {
    const canvas = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.appendChild(renderer.domElement);

    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
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
      camera.position.z -= 0.5;
    }

    const handleZoomOut = () => {
      camera.position.z += 0.5;
    }

    document.getElementById('zoom-in').addEventListener('click', handleZoomIn);
    document.getElementById('zoom-out').addEventListener('click', handleZoomOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);
  
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isDarkMode ? 0x000000 : 0xFFFFFF);
    }
    if (cubeRef.current) {
      cubeRef.current.material.color.set(isDarkMode ? 0x88ccff : 0x44aa88);
    }
  }, [isDarkMode]);
  

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  }

  return (
    <div className={isDarkMode ? 'dark-mode' : ''}>
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div id="canvas-container"></div>

      <div className='controls'>
        <button id='zoom-in' className='control-button'>+</button>
        <button id='zoom-out' className='control-button'>-</button>
        <button onClick={toggleTheme} className='control-button'></button>
      </div>
    </div>
  );
}

export default App;