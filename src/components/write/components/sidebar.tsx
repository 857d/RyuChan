import { ConfigSection } from './sections/config-section'
import { MetaSection } from './sections/meta-section'
import { ImagesSection } from './sections/images-section'

type WriteSidebarProps = {
    categories?: string[]
}

export function WriteSidebar({ categories = [] }: WriteSidebarProps) {
    return (
        <div className="space-y-6">
            <ConfigSection />
            <MetaSection categories={categories} />
            <ImagesSection />
        </div>
    )
}
