import { Material } from "./material";

export class MaterialReferenceNode {
  public referenceCount: number = 1

  public constructor(public material: Material | undefined) {}
}

export class MaterialManager {
  private static _materials: Record<string, MaterialReferenceNode> = {}
  
  private constructor() {}

  public static registerMaterial(material: Material): void {
    if (MaterialManager._materials[material.name] === undefined) {
      MaterialManager._materials[material.name] = new MaterialReferenceNode(material)
    }
  }

  public static getMaterial(materialName: string): Material | undefined {
    if (MaterialManager._materials[materialName] === undefined) {
      return undefined
    } else {
      MaterialManager._materials[materialName].referenceCount++
      return MaterialManager._materials[materialName].material
    }
  }

  public static releaseMaterial(materialName: string): void {
    const referenceNode = MaterialManager._materials[materialName] 
    
    if (referenceNode === undefined) {
      console.warn("Cannot release a material which has not been registered")
    } else {
      referenceNode.referenceCount--

      if (referenceNode.referenceCount < 1) {
        referenceNode.material?.destory()
        referenceNode.material = undefined
        
        delete MaterialManager._materials[materialName]
      }
    }
  }
}