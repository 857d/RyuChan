export interface NavItem {
    name: string;
    avatar: string;
    description: string;
    url: string;
    category: string;
    id?: string;
    badge?: string;
    badgeIcon?: string;
    badgeColor?: string;
}

export interface NavCategory {
    title: string;
    icon: string;
    items: NavItem[];
}

export const NAV_DATA: NavCategory[] = [
    {
        title: "开发工具",
        icon: "lucide:code",
        items: [
            /* 
             * 徽章 (Badge) 配置示例：
             * badge: "徽章文本"
             * badgeIcon: "图标名称" (如 "lucide:heart")
             * badgeColor: 支持以下格式
             *   - Tailwind 颜色名: "rose", "sky", "amber" (自动适配深浅色)
             *   - Hex 颜色: "#FF5733"
             *   - RGB 颜色: "rgb(34, 197, 94)"
             */
            {
                name: "Telegram",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-f9dd10ed-b476-4800-8f29-533baf3c082a.png",
                description: "需开启加速器",
                url: "https://telegram.org/",
                category: "纸飞机",
                id: "DEV001"
            },
            {
                name: "X",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-6c61e698-1031-4acd-b712-3b0d20389a48.png",
                description: "国外人都在用的微博",
                url: "https://x.com/",
                category: "推特",
                id: "DEV002"
            },
            {
                name: "App Store",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-1e0752ec-661d-4d36-9c76-9537e6e9a390.png",
                description: "可下载外区软件",
                url: "https://www.apple.com/app-store/",
                category: "外区ID",
                id: "DEV003"
            },
            {
                name: "Google",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-08c19452-1578-4eb0-bee3-947526730092.png",
                description: "最强大的搜索引擎",
                url: "https://www.google.cn/",
                category: "谷歌",
                id: "DEV004"
            },
            {
                name: "Instagram",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-ed8b70e9-19a9-4e49-8a00-1eb279832602.png",
                description: "国外人都在用的小红书",
                url: "https://www.instagram.com/",
                category: "ig·ins",
                id: "DEV005"
            },
            {
                name: "Facebook",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-e5aec287-925b-4a12-8d1d-23847e7ce245.png",
                description: "全球最大的社交网络服务平台",
                url: "https://www.facebook.com/",
                category: "脸书",
                id: "DEV006"
            },
            {
                name: "Whateapp",
                avatar: "https://cdn.phototourl.com/free/2026-04-17-8ce5a079-7bb0-449c-95d5-125a0c2c103a.png",
                description: "跨平台即时通讯应用程序",
                url: "https://www.whatsapp.com/",
                category: "Whateapp",
                id: "DEV007"
            }
        ]
    },
];
