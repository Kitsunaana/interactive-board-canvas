import {createStrictContext, useStrictContext} from "./utils"
import {Container} from "../core/Container"

export const ContainerContext = createStrictContext<Container>()

export const useContainerParent = () => useStrictContext(ContainerContext)