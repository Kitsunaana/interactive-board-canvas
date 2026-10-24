import { isNil } from "lodash";
import { forwardRef, useEffect, useImperativeHandle, useRef, type PropsWithChildren } from "react";
import { Group } from "../core/Group";
import { ContainerContext, useContainerParent } from "./Container";
import { createStrictContext, useStrictContext } from "./utils";
import { CALLBACK_NAME_ALIASES, type NodeProps } from "./Node";
import { forEachObject, type AnyFunction } from "../../engine/utils";

export type GroupNodeProps = PropsWithChildren & NodeProps

export const GroupContext = createStrictContext<Group>()

export const useGroupContext = () => useStrictContext(GroupContext)

export const GroupNode = forwardRef<Group, GroupNodeProps>(({ children, attributes, ...callbacks }, ref) => {
  const groupModelRef = useRef<Group | null>(null)
  if (isNil(groupModelRef.current)) groupModelRef.current = new Group()
  const container = useContainerParent()

  useImperativeHandle(ref, () => groupModelRef.current as Group, [groupModelRef.current])

  useEffect(() => {
    const group = groupModelRef.current!

    forEachObject(callbacks, ({ key, value }) => group.on(CALLBACK_NAME_ALIASES[key] ?? key, value as AnyFunction))
    return () => forEachObject(callbacks, ({ key, value }) => group.off(CALLBACK_NAME_ALIASES[key] ?? key, value as AnyFunction))
  }, [callbacks])

  useEffect(() => {
    const group = groupModelRef.current!

    group.clearDataAttrs()

    if (attributes) {
      Object
        .entries(attributes)
        .map(([key, value]) => group.setDataAttr(key, value))
    }
  }, [attributes])

  useEffect(() => {
    const group = groupModelRef.current!
    container.appendChild(group)

    return () => {
      groupModelRef.current?.destroy()
      groupModelRef.current = null
    }
  }, []);

  return (
    <ContainerContext.Provider value={groupModelRef.current}>
      <GroupContext.Provider value={groupModelRef.current}>
        {children}
      </GroupContext.Provider>
    </ContainerContext.Provider>
  )
})