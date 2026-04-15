import { AssetManager, MESSAGE_ASSET_LOADER_ASSET_LOADED } from "../assets/asset-manager";
import { JsonAsset } from "../assets/json-asset-loader";
import { Shader } from "../gl/shader";
import { Message } from "../message/message";
import type { MessageHandler } from "../message/message-handler";
import { Zone } from "./zone";
import { z } from "zod"

const zoneSchema = z.object({
  id: z.union([z.string(), z.number()]),
  description: z.string().optional(),
  name: z.string(),
}).transform((data) => ({
  ...data,
  description: "",
  id: Number(data.id),
}))

export class ZoneManager implements MessageHandler {
  private static _globalZoneID: number = -1
  private static _registredZones: Record<number, string> = {}
  private static _activeZone: Zone | null = null
  private static _instance = new ZoneManager()

  private constructor() { }

  public static initialize(): void {
    ZoneManager._registredZones[0] = "engine-v2/assets/zones/test-zone.json"
  }

  public static changeZone(id: number): void {
    if (ZoneManager._activeZone !== null) {
      ZoneManager._activeZone.onDeactivated()
      ZoneManager._activeZone.unload()
      ZoneManager._activeZone = null
    }

    if (ZoneManager._registredZones[id] !== undefined) {
      if (AssetManager.isAssetLoaded(ZoneManager._registredZones[id])) {
        const asset = AssetManager.getAsset(ZoneManager._registredZones[id]) as JsonAsset
        ZoneManager._loadZone(asset)
      } else {
        const code = MESSAGE_ASSET_LOADER_ASSET_LOADED + ZoneManager._registredZones[id]
        const onMessage = ZoneManager._instance.onMessage.bind(ZoneManager._instance)

        Message.subscribe(code, { onMessage })

        AssetManager.loadAsset(ZoneManager._registredZones[id])
      }
    } else {
      throw new Error(`Zone id: ${id} does not exist`)
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

  private static _loadZone(asset: JsonAsset): void {
    const { success, data } = zoneSchema.safeParse(asset.data)

    if (success) {
      ZoneManager._activeZone = new Zone(data.id, data.name, data.description)
      ZoneManager._activeZone.initialize(asset.data)
      ZoneManager._activeZone.onActivated()
      ZoneManager._activeZone.load()
    }
  }

  public onMessage(message: Message): void {
    if (message.code.indexOf(MESSAGE_ASSET_LOADER_ASSET_LOADED)) {
      const asset = message.context as JsonAsset
      ZoneManager._loadZone(asset)
    }
  }
}