import * as THREE from "three"
import { useCallback, useEffect, useState } from "react"
import { useLoader } from "@react-three/fiber"
import { useBox } from "@react-three/cannon"
import { proxy, subscribe, snapshot } from "valtio"
import * as Y from "yjs"
import { bindProxyAndYMap } from "valtio-yjs"
import { WebrtcProvider } from "y-webrtc"
import dirt from "./assets/dirt.jpg"

const ydoc = new Y.Doc()
new WebrtcProvider("minecraft-valtio-yjs-demo-2", ydoc)
const ymap = ydoc.getMap("map")

// This is a super naive implementation and wouldn't allow for more than a few thousand boxes.
// In order to make this scale this has to be one instanced mesh, then it could easily be
// hundreds of thousands.

const cubeStore = proxy({
  cubes: [],
})
const addCube = (x, y, z) => {
  cubeStore.cubes.push([x, y, z])
}
const useCubes = () => {
  const [slice, setSlice] = useState(() => snapshot(cubeStore).cubes)
  useEffect(() => {
    return subscribe(cubeStore, () => {
      setSlice(snapshot(cubeStore).cubes)
    })
  }, [])
  return slice || []
}

bindProxyAndYMap(cubeStore, ymap)

export const Cubes = () => {
  const cubes = useCubes()
  return cubes.map((coords, index) => <Cube key={index} position={coords} />)
}

export const Cube = (props) => {
  const [ref] = useBox(() => ({ type: "Static", ...props }))
  const [hover, set] = useState(null)
  const texture = useLoader(THREE.TextureLoader, dirt)
  const onMove = useCallback((e) => (e.stopPropagation(), set(Math.floor(e.faceIndex / 2))), [])
  const onOut = useCallback(() => set(null), [])
  const onClick = useCallback((e) => {
    e.stopPropagation()
    const { x, y, z } = ref.current.position
    const dir = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ]
    addCube(...dir[Math.floor(e.faceIndex / 2)])
  }, [])
  return (
    <mesh ref={ref} receiveShadow castShadow onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
      {[...Array(6)].map((_, index) => (
        <meshStandardMaterial attachArray="material" key={index} map={texture} color={hover === index ? "hotpink" : "white"} />
      ))}
      <boxGeometry />
    </mesh>
  )
}
