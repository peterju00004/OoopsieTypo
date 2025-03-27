import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import './App.css';
import { render } from 'sass';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraPositionRef = useRef({x: 0, z: 2})
  const animationFrameRef = useRef(null);
  const cubeRef = useRef(null);
  const isMouseDown = useRef(false);
  const lastMousePosition = useRef({x: 0, y: 0});

  useEffect(() => {
    const canvas = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraPositionRef.current.x, 0, cameraPositionRef.current.z);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
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

      camera.rotation.y += deltaX * 0.005;
      camera.rotation.x += deltaY * 0.005;

      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

      lastMousePosition.current = {x: e.clientX, y: e.clientY};
    }

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);

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

  useEffect(() => {
    if (!sceneRef.current || !cubeRef.current) return;

    const targetX = menuOpen ? -1.5 : 0;
    const camera = cameraRef.current;

    if (camera) {
      const animate = () => {
        const dx = targetX - camera.position.x;
        if (Math.abs(dx) > 0.01) {
          camera.position.x += dx * 0.1;
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          camera.position.x = targetX
        }

        cameraPositionRef.current.x = camera.position.x;
      }

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
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

      <div className='controls'>
        <button id='zoom-in' className='control-button'>+</button>
        <button id='zoom-out' className='control-button'>-</button>
        <button onClick={toggleTheme} className='control-button'></button>
      </div>
    </div>
  );
}

export default App;