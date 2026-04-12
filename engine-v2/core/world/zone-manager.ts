import { Shader } from "../gl/shader";
import { TestZone } from "./test-zone";
import { Zone } from "./zone";

export class ZoneManager {
  private static _globalZoneID: number = -1
  private static _zones: Record<number, Zone> = {}
  private static _activeZone: Zone | null = null

  private constructor() { }

  public static createZone(name: string, description: string): number {
    ZoneManager._globalZoneID++
    const zone = new Zone(ZoneManager._globalZoneID, name, description)
    ZoneManager._zones[ZoneManager._globalZoneID] = zone

    return ZoneManager._globalZoneID
  }

  public static createTestZone(): number {
    ZoneManager._globalZoneID++
    const zone = new TestZone(ZoneManager._globalZoneID, "", "")
    ZoneManager._zones[ZoneManager._globalZoneID] = zone

    return ZoneManager._globalZoneID

  }

  public static changeZone(id: number): void {
    if (ZoneManager._activeZone !== null) {
      ZoneManager._activeZone.onDeactivated()
      ZoneManager._activeZone.unload()
    }

    if (ZoneManager._zones[id] !== undefined) {
      ZoneManager._activeZone = ZoneManager._zones[id]
      ZoneManager._activeZone.onActivated()
      ZoneManager._activeZone.load()
    }
  }

  public static update(time: number): void {
    if (ZoneManager._activeZone !== null) {
      ZoneManager._activeZone.update(time)
    }
  }

  public static render(shader: Shader): void {
    if (ZoneManager._activeZone !== null) {
      ZoneManager._activeZone.render(shader)
    }
  }
}