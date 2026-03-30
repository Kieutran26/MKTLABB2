import React, { useState, useRef, useEffect } from 'react';
import { 
    Facebook, Instagram, Linkedin, AtSign, Video, Search, 
    Monitor, Smartphone, Upload, Download, Heart, MessageCircle, 
    Share2, MoreHorizontal, Globe, Star, Image as ImageIcon, X, 
    Plus, ChevronLeft, ChevronRight, Bookmark, Music2, ThumbsUp, Check, Loader2
} from 'lucide-react';
// @ts-ignore
import { toPng } from 'html-to-image';
import { Toast, ToastType } from './Toast';
import { useBrand } from './BrandContext';

type Platform = 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'google';
type Device = 'mobile' | 'desktop';
type Format = 'square' | 'portrait' | 'landscape' | 'story' | 'carousel';
type CTA = 'Learn More' | 'Shop Now' | 'Sign Up' | 'Book Now' | 'Contact Us' | 'Download' | 'Apply Now' | 'Watch More' | 'Send Message' | 'Order Now' | 'Subscribe';

// Custom Icons for FB Reactions
const FbIcons: Record<string, React.ReactNode> = {
    Like: <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center border-2 border-white"><ThumbsUp size={10} fill="white" color="white"/></div>,
    Love: <div className="w-5 h-5 rounded-full bg-[#F02849] flex items-center justify-center border-2 border-white"><Heart size={10} fill="white" color="white"/></div>,
    Care: <div className="w-5 h-5 rounded-full bg-[#F7B125] flex items-center justify-center border-2 border-white text-[10px]">🥰</div>,
    Haha: <div className="w-5 h-5 rounded-full bg-[#F7B125] flex items-center justify-center border-2 border-white text-[10px]">😆</div>,
    Wow: <div className="w-5 h-5 rounded-full bg-[#F7B125] flex items-center justify-center border-2 border-white text-[10px]">😮</div>,
    Sad: <div className="w-5 h-5 rounded-full bg-[#F7B125] flex items-center justify-center border-2 border-white text-[10px]">😢</div>,
    Angry: <div className="w-5 h-5 rounded-full bg-[#F02849] flex items-center justify-center border-2 border-white text-[10px]">😡</div>,
};

const MockupGenerator: React.FC = () => {
    // --- Context ---
    const { currentBrand } = useBrand();

    // --- Core States ---
    const [platform, setPlatform] = useState<Platform>('facebook');
    const [device, setDevice] = useState<Device>('mobile');
    const [format, setFormat] = useState<Format>('square');
    
    // --- Content States ---
    const [avatar, setAvatar] = useState<string | null>(null);
    const [username, setUsername] = useState('My Brand Page');
    const [caption, setCaption] = useState('Viết nội dung bài đăng của bạn tại đây... 🚀 #marketing #mockup');
    const [mediaImage, setMediaImage] = useState<string | null>(null);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    
    // --- Metrics ---
    const [likes, setLikes] = useState('1.2K');
    const [comments, setComments] = useState('45');
    const [shares, setShares] = useState('12');
    const [favorites, setFavorites] = useState('300'); // TikTok specific
    
    // --- Ad & CTA ---
    const [isAd, setIsAd] = useState(false);
    const [website, setWebsite] = useState('www.mybrand.com');
    const [ctaText, setCtaText] = useState<CTA>('Learn More');
    
    // --- Specific Features ---
    const [postTime, setPostTime] = useState('2 giờ trước'); // Insta/FB
    const [soundName, setSoundName] = useState('Original Sound - Trending Music'); // TikTok
    const [fbReactions, setFbReactions] = useState<string[]>(['Like', 'Love']); // FB Max 3
    
    // --- Google SEO Inputs ---
    const [metaTitle, setMetaTitle] = useState('Tiêu đề bài viết chuẩn SEO - Tối ưu 60 ký tự');
    const [metaDesc, setMetaDesc] = useState('Mô tả meta description hấp dẫn, chứa từ khóa chính và khuyến khích người dùng click vào trang web của bạn.');
    const [urlSlug, setUrlSlug] = useState('mywebsite.com › danh-muc');
    const [favicon, setFavicon] = useState<string | null>(null);
    const [showRichSnippets, setShowRichSnippets] = useState(false);
    const [starRating, setStarRating] = useState(4.8);

    // System
    const previewRef = useRef<HTMLDivElement>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Auto-fill from Brand
    useEffect(() => {
        if (currentBrand) {
            setUsername(currentBrand.identity.name);
            if (currentBrand.identity.logoMain) setAvatar(currentBrand.identity.logoMain);
            if (currentBrand.identity.logoIcon) setFavicon(currentBrand.identity.logoIcon);
            // Default website style
            setWebsite(currentBrand.identity.name.toLowerCase().replace(/\s/g, '') + '.com');
        }
    }, [currentBrand]);

    // --- Helpers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'media' | 'favicon' | 'carousel') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (type === 'carousel') {
            const newImages: string[] = [];
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (ev.target?.result) newImages.push(ev.target.result as string);
                    if (newImages.length === files.length) {
                        setCarouselImages(prev => [...prev, ...newImages].slice(0, 10)); // Max 10
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const res = ev.target?.result as string;
                if (type === 'avatar') setAvatar(res);
                if (type === 'media') setMediaImage(res);
                if (type === 'favicon') setFavicon(res);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleFbReaction = (reaction: string) => {
        if (fbReactions.includes(reaction)) {
            setFbReactions(prev => prev.filter(r => r !== reaction));
        } else {
            if (fbReactions.length < 3) {
                setFbReactions(prev => [...prev, reaction]);
            } else {
                setToast({ message: 'Tối đa 3 reactions', type: 'info' });
            }
        }
    };

    const handleDownload = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);

        try {
            // 1. Identify the Target Node
            // previewRef points to the wrapper. We want the specific inner visual (e.g. the 375px width div)
            // Structure: previewRef -> div.p-8 -> TargetElement
            const targetNode = previewRef.current.querySelector('.mockup-target') as HTMLElement;

            if (!targetNode) {
                throw new Error("Không tìm thấy khung hình Mockup để xuất.");
            }

            // 2. Wait for Fonts
            await document.fonts.ready;

            // 3. Render using html-to-image
            // High Quality Config: Pixel Ratio 3, Skip Scaling, Cache Bust
            const dataUrl = await toPng(targetNode, {
                quality: 1.0,
                pixelRatio: 3, // Retina quality
                cacheBust: true,
                skipAutoScale: true,
                backgroundColor: null, // Ensure transparency if needed (or white)
                style: {
                    margin: '0', // Reset margins during capture to prevent cropping
                    transform: 'none', // Reset any CSS transforms
                    boxShadow: 'none' // Optional: Remove shadow if you want a clean cut
                }
            });

            // 4. Download
            const link = document.createElement('a');
            link.download = `${platform}-mockup-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            
            setToast({ message: 'Đã tải ảnh chất lượng cao thành công!', type: 'success' });

        } catch (err) {
            console.error("Export Error:", err);
            setToast({ message: 'Lỗi khi xuất ảnh. Vui lòng thử lại.', type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const getAspectRatioClass = () => {
        switch(format) {
            case 'square': return 'aspect-square';
            case 'portrait': return 'aspect-[4/5]';
            case 'landscape': return 'aspect-video';
            case 'story': return 'aspect-[9/16]';
            case 'carousel': return 'aspect-square';
            default: return 'aspect-square';
        }
    };

    // --- RENDERERS ---

    const renderInstagram = () => {
        const isStory = format === 'story';
        const widthClass = device === 'mobile' ? 'w-[375px]' : 'w-[500px] border rounded-xl';
        
        if (isStory) {
            return (
                <div className={`mockup-target bg-black text-white relative overflow-hidden shadow-xl mx-auto ${device === 'mobile' ? 'w-[375px] h-[667px]' : 'w-[400px] h-[711px] rounded-xl'}`}>
                    {/* Story Content */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        {mediaImage ? (
                            <img src={mediaImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-slate-500">Upload Story Image (9:16)</div>
                        )}
                    </div>
                    
                    {/* Header */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="bg-slate-500 w-full h-full"></div>}
                        </div>
                        <span className="font-semibold text-sm shadow-sm drop-shadow-md">{username.toLowerCase().replace(/\s/g, '_')}</span>
                        <span className="text-white/70 text-sm drop-shadow-md">2 giờ</span>
                    </div>

                    {/* Footer Actions */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-4">
                        <div className="flex-1 h-11 rounded-full border border-white/30 flex items-center px-4 bg-black/20 backdrop-blur-sm">
                            <span className="text-white/70 text-sm">Gửi tin nhắn...</span>
                        </div>
                        <Heart size={28} className="drop-shadow-md" />
                        <SendIcon className="rotate-0 drop-shadow-md" />
                    </div>

                    {/* Ad CTA for Story */}
                    {isAd && (
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center animate-bounce">
                            <div className="text-xs font-bold uppercase mb-1 drop-shadow-md">^</div>
                            <div className="bg-black/40 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full font-bold text-sm text-white">
                                {ctaText}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        return (
            <div className={`mockup-target bg-white font-sans text-slate-900 border border-slate-200 shadow-sm mx-auto ${widthClass}`}>
                {/* Header */}
                <div className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full p-[2px] ${isStory ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' : 'bg-transparent'}`}>
                            <div className="w-full h-full rounded-full bg-white p-[2px]">
                                {avatar ? <img src={avatar} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-slate-200 rounded-full"></div>}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="font-semibold text-sm leading-tight">
                                {username.toLowerCase().replace(/\s/g, '_')}
                            </div>
                            {isAd && <div className="text-xs text-slate-500 leading-tight">Được tài trợ</div>}
                        </div>
                    </div>
                    <MoreHorizontal size={20} />
                </div>

                {/* Media */}
                <div className={`w-full bg-slate-100 overflow-hidden relative ${getAspectRatioClass()}`}>
                    {mediaImage ? (
                        <img src={mediaImage} className="w-full h-full object-cover" alt="Content" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                            <ImageIcon size={48} />
                        </div>
                    )}
                    {/* Ad Banner Overlay */}
                    {isAd && (
                        <div className="absolute bottom-0 left-0 right-0 bg-indigo-50/95 p-3 flex justify-between items-center border-t border-indigo-100">
                            <span className="text-sm font-semibold text-indigo-900">{ctaText}</span>
                            <ChevronRight size={16} className="text-indigo-900"/>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-3">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-4">
                            <Heart size={24} className="hover:text-slate-600 cursor-pointer"/>
                            <MessageCircle size={24} className="-rotate-90 hover:text-slate-600 cursor-pointer" />
                            <SendIcon />
                        </div>
                        <Bookmark size={24} className="hover:text-slate-600 cursor-pointer"/>
                    </div>
                    
                    <div className="font-semibold text-sm mb-2">{likes} lượt thích</div>
                    
                    <div className="text-sm mb-2">
                        <span className="font-semibold mr-2">{username.toLowerCase().replace(/\s/g, '_')}</span>
                        <span>{caption}</span>
                    </div>

                    <div className="text-xs text-slate-400 uppercase">{postTime.toUpperCase()}</div>
                </div>
            </div>
        );
    };

    const renderFacebook = () => {
        const isCarousel = format === 'carousel';
        const widthClass = device === 'mobile' ? 'w-[375px]' : 'w-[550px] rounded-lg my-4';
        
        return (
            <div className={`mockup-target bg-white font-sans text-slate-900 border border-slate-200 shadow-sm mx-auto ${widthClass}`}>
                {/* Header */}
                <div className="p-4 flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100 cursor-pointer">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-600"></div>}
                        </div>
                        <div>
                            <div className="font-bold text-[15px] leading-tight hover:underline cursor-pointer text-[#050505]">
                                {username}
                            </div>
                            <div className="text-[13px] text-slate-500 flex items-center gap-1 mt-0.5">
                                {isAd ? (
                                    <>
                                        <span>Được tài trợ</span>
                                        <span aria-hidden="true"> · </span>
                                        <Globe size={11} />
                                    </>
                                ) : (
                                    <>
                                        <span>{postTime}</span>
                                        <span aria-hidden="true"> · </span>
                                        <Globe size={11} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <MoreHorizontal size={20} className="text-slate-500" />
                </div>
                
                {/* Caption */}
                <div className="px-4 pb-3 text-[15px] whitespace-pre-wrap leading-normal text-[#050505]">
                    {caption}
                </div>

                {/* Media */}
                {isCarousel ? (
                    <div className="w-full overflow-hidden">
                        <div className="flex overflow-x-auto snap-x no-scrollbar gap-1 px-1">
                            {carouselImages.length > 0 ? carouselImages.map((img, idx) => (
                                <div key={idx} className="snap-center shrink-0 w-[85%] relative bg-slate-100 aspect-square border border-slate-100 first:ml-0">
                                     <img src={img} className="w-full h-full object-cover" />
                                     {isAd && (
                                         <div className="bg-slate-100 p-3 border-t border-slate-200">
                                            <div className="text-xs text-slate-500 uppercase">{website}</div>
                                            <div className="font-bold text-sm flex justify-between items-center">
                                                {ctaText}
                                                <div className="bg-slate-200 p-1 rounded"><ChevronRight size={14}/></div>
                                            </div>
                                         </div>
                                     )}
                                </div>
                            )) : (
                                <div className="w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-400">
                                    Thêm ảnh Carousel trong cài đặt
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`w-full bg-slate-100 overflow-hidden relative border-y border-slate-200 ${getAspectRatioClass()}`}>
                        {mediaImage ? (
                            <img src={mediaImage} className="w-full h-auto block" alt="Content" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon size={48} />
                            </div>
                        )}
                    </div>
                )}

                {/* Ad CTA Bar (Single Image) */}
                {isAd && !isCarousel && (
                    <div className="bg-slate-100 px-4 py-3 flex justify-between items-center border-b border-slate-200">
                         <div>
                             <div className="text-xs text-slate-500 uppercase mb-0.5">{website}</div>
                             <div className="font-bold text-slate-800 text-[15px]">{ctaText}</div>
                         </div>
                         <button className="bg-slate-300 hover:bg-slate-400 text-slate-800 px-4 py-2 rounded-md text-sm font-semibold transition-colors">
                             {ctaText}
                         </button>
                    </div>
                )}

                {/* Metrics */}
                <div className="px-4 py-2.5 flex justify-between items-center text-[13px] text-slate-500 border-b border-slate-200/60">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
                        {fbReactions.length > 0 && (
                             <div className="flex -space-x-1">
                                 {fbReactions.map(r => (
                                     <div key={r} className="z-10">{FbIcons[r]}</div>
                                 ))}
                             </div>
                        )}
                        <span>{likes}</span>
                    </div>
                    <div className="flex gap-3">
                        <span className="cursor-pointer hover:underline">{comments} bình luận</span>
                        <span className="cursor-pointer hover:underline">{shares} lượt chia sẻ</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-2 py-1 flex items-center justify-between text-[#65676B]">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg font-medium text-[15px] transition-colors">
                        <ThumbsUp size={20} /> <span className="hidden sm:inline">Thích</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg font-medium text-[15px] transition-colors">
                        <MessageCircle size={20} /> <span className="hidden sm:inline">Bình luận</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-100 rounded-lg font-medium text-[15px] transition-colors">
                        <Share2 size={20} /> <span className="hidden sm:inline">Chia sẻ</span>
                    </button>
                </div>
            </div>
        );
    };

    const renderTikTok = () => (
        <div className={`mockup-target bg-black text-white relative mx-auto overflow-hidden shadow-xl border border-slate-800 ${device === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl' : 'w-[400px] h-[700px] rounded-xl'}`}>
             {/* Background */}
             {mediaImage ? (
                <img src={mediaImage} className="w-full h-full object-cover opacity-90" alt="BG" />
             ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <Video size={48} className="text-slate-600" />
                    <div className="absolute mt-20 text-slate-500 text-sm">Upload ảnh 9:16</div>
                </div>
             )}

             {/* UI Overlay */}
             <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/80">
                 {/* Top Tabs */}
                 <div className="flex justify-center pt-8 gap-4 text-shadow font-bold text-base">
                     <span className="opacity-70 text-white drop-shadow-md">Đang Follow</span>
                     <span className="relative text-white drop-shadow-md after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-1 after:bg-white after:rounded-full">Dành cho bạn</span>
                 </div>
                 
                 <div className="flex items-end justify-between mb-4">
                     <div className="flex-1 pr-14">
                         <div className="font-bold mb-2 shadow-black drop-shadow-md text-[17px] text-white">@{username.replace(/\s/g, '')}</div>
                         <div className="text-[15px] shadow-black drop-shadow-md line-clamp-3 mb-3 leading-relaxed text-white">{caption}</div>
                         
                         {/* Sound */}
                         <div className="flex items-center gap-2 text-[15px] font-bold text-white">
                             <Music2 size={14} /> 
                             <div className="w-32 overflow-hidden whitespace-nowrap">
                                <span className="animate-marquee">{soundName}</span>
                             </div>
                         </div>

                         {/* Ad CTA - Use solid color fallback for html2canvas */}
                         {isAd && (
                             <div className="mt-4 bg-[#FF0050] text-white px-3 py-1.5 rounded-sm w-fit font-bold text-xs flex items-center gap-1 cursor-pointer">
                                 {ctaText} <ChevronRight size={14}/>
                             </div>
                         )}
                     </div>
                     
                     {/* Right Sidebar */}
                     <div className="flex flex-col items-center gap-5">
                         <div className="relative mb-1">
                            <div className="w-12 h-12 rounded-full border border-white overflow-hidden shadow-sm">
                                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="bg-white w-full h-full"></div>}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF0050] rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold shadow-sm">+</div>
                         </div>
                         
                         <div className="flex flex-col items-center gap-1">
                             <Heart size={32} fill="white" className="text-white drop-shadow-md" />
                             <span className="text-xs font-bold drop-shadow-md text-white">{likes}</span>
                         </div>
                         <div className="flex flex-col items-center gap-1">
                             <MessageCircle size={32} fill="white" className="text-white drop-shadow-md" />
                             <span className="text-xs font-bold drop-shadow-md text-white">{comments}</span>
                         </div>
                         <div className="flex flex-col items-center gap-1">
                             <Bookmark size={32} fill="white" className="text-white drop-shadow-md" />
                             <span className="text-xs font-bold drop-shadow-md text-white">{favorites}</span>
                         </div>
                         <div className="flex flex-col items-center gap-1">
                             <Share2 size={32} fill="white" className="text-white drop-shadow-md" />
                             <span className="text-xs font-bold drop-shadow-md text-white">{shares}</span>
                         </div>
                         
                         <div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-slate-900 overflow-hidden animate-spin-slow mt-2">
                              {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : null}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    );

    const renderThreads = () => {
         const widthClass = device === 'mobile' ? 'w-[375px]' : 'w-[550px] rounded-xl';
         return (
            <div className={`mockup-target bg-white font-sans text-black border border-slate-200 shadow-sm mx-auto ${widthClass} p-4`}>
                <div className="flex gap-3">
                    {/* Left Column (Avatar + Thread Line) */}
                    <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden mb-2 cursor-pointer border border-slate-100">
                            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="w-0.5 flex-1 bg-slate-200 my-1 rounded-full min-h-[40px]"></div>
                        {/* Small overlap avatars would go here in real thread, simplified for mockup */}
                    </div>
                    
                    {/* Right Column (Content) */}
                    <div className="flex-1 pb-2">
                        <div className="flex justify-between items-center mb-1">
                            <div className="font-bold text-[15px] leading-none">{username.toLowerCase().replace(/\s/g, '_')} <span className="text-blue-500 text-[10px] align-top">Example</span></div>
                            <div className="flex items-center gap-3 text-slate-400">
                                <span className="text-[15px]">2 giờ</span>
                                <MoreHorizontal size={20} />
                            </div>
                        </div>
                        
                        <div className="text-[15px] mb-3 whitespace-pre-wrap leading-relaxed">{caption}</div>
                        
                        {mediaImage && (
                            <div className="rounded-xl overflow-hidden border border-slate-100 mb-3 max-h-[400px]">
                                <img src={mediaImage} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="flex gap-4 mb-2">
                            <Heart size={20} className="stroke-[2.5]"/>
                            <MessageCircle size={20} className="-scale-x-100 stroke-[2.5]" />
                            <RefreshCcwIcon />
                            <SendIcon />
                        </div>
                        
                        <div className="text-slate-400 text-sm">
                            {comments} câu trả lời • {likes} lượt thích
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderGoogle = () => {
        const isMobile = device === 'mobile';
        const truncatedTitle = metaTitle.length > 60 ? metaTitle.substring(0, 57) + '...' : metaTitle;
        const truncatedDesc = metaDesc.length > 160 ? metaDesc.substring(0, 157) + '...' : metaDesc;

        return (
            <div className={`mockup-target bg-white font-sans text-slate-900 border border-slate-200 shadow-sm mx-auto p-4 ${isMobile ? 'w-[375px]' : 'w-[600px] rounded-lg'}`}>
                {/* Header (URL + Favicon) */}
                <div className="flex items-center gap-3 mb-2 group cursor-pointer">
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center p-1 border border-slate-100">
                         {favicon ? <img src={favicon} className="w-full h-full object-contain" /> : <Globe size={14} className="text-slate-400"/>}
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-800 leading-none mb-1 font-medium">{urlSlug.split(' ')[0]}</span>
                        <div className="text-xs text-slate-500 leading-none flex items-center gap-1">
                             {urlSlug} <MoreHorizontal size={12} />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className={`text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium mb-1 leading-snug`}>
                    {truncatedTitle}
                </h3>

                {/* Rich Snippets */}
                {showRichSnippets && (
                    <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                        <span className="font-bold text-slate-700">{starRating}</span>
                        <div className="flex">
                            {[1,2,3,4,5].map(i => (
                                <Star key={i} size={12} fill={i <= Math.floor(starRating) ? "#f59e0b" : "none"} stroke={i <= Math.floor(starRating) ? "#f59e0b" : "#cbd5e1"} />
                            ))}
                        </div>
                        <span className="text-slate-500">(1,240)</span>
                    </div>
                )}

                {/* Description + Thumbnail */}
                <div className="flex gap-4">
                    <div className="text-sm text-[#4d5156] leading-relaxed">
                        <span className="text-slate-400">15 thg 1, 2025 — </span>
                        {truncatedDesc}
                    </div>
                    {isMobile && mediaImage && showRichSnippets && (
                        <div className="w-24 h-24 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                            <img src={mediaImage} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
             {/* Header */}
             <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                 <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                     <Monitor className="text-indigo-600"/> Mockup Generator
                 </div>
                 <div className="flex gap-2">
                     {/* Device Toggle */}
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-md transition-all ${device === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><Smartphone size={16}/></button>
                        <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-md transition-all ${device === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><Monitor size={16}/></button>
                     </div>
                 </div>
             </div>

             {/* Main Content */}
             <div className="flex-1 flex overflow-hidden">
                 
                 {/* LEFT SIDEBAR: EDITOR */}
                 <div className="w-[420px] bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 overflow-y-auto custom-scrollbar">
                     <div className="p-6 pb-20 space-y-8">
                         
                         {/* 1. Platform Selector */}
                         <div className="grid grid-cols-5 gap-2">
                             {[
                                 { id: 'facebook', icon: Facebook, color: 'text-blue-600' },
                                 { id: 'instagram', icon: Instagram, color: 'text-pink-600' },
                                 { id: 'tiktok', icon: Video, color: 'text-black' },
                                 { id: 'threads', icon: AtSign, color: 'text-black' },
                                 { id: 'google', icon: Search, color: 'text-green-600' }
                             ].map(p => (
                                 <button 
                                    key={p.id}
                                    onClick={() => setPlatform(p.id as Platform)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${platform === p.id ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-transparent hover:bg-slate-50 text-slate-500'}`}
                                 >
                                     <p.icon size={24} className={`mb-1 ${platform === p.id ? p.color : ''}`} />
                                     <span className="text-[10px] font-bold uppercase">{p.id}</span>
                                 </button>
                             ))}
                         </div>

                         {/* 2. Format & Layout (Not for Google) */}
                         {platform !== 'google' && platform !== 'threads' && (
                             <div className="space-y-4 border-t border-slate-100 pt-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Định dạng (Format)</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(platform === 'tiktok' ? ['portrait'] : ['square', 'landscape', 'portrait', 'story', 'carousel']).map(f => {
                                        // Filter logic
                                        if (platform === 'facebook' && f === 'story') return null;
                                        if (platform === 'facebook' && f === 'portrait') return <button key={f} onClick={() => setFormat(f as Format)} className={`text-xs font-bold py-2 rounded-lg border ${format === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}>Tall (4:5)</button>;
                                        return (
                                            <button 
                                                key={f}
                                                onClick={() => setFormat(f as Format)}
                                                className={`text-xs font-bold py-2 rounded-lg border transition-all ${format === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                            >
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        )
                                    })}
                                </div>
                             </div>
                         )}

                         {/* 3. Ad Toggle */}
                         {platform !== 'google' && platform !== 'threads' && (
                             <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                 <label className="text-sm font-bold text-slate-700">Chế độ Quảng cáo (Ads)</label>
                                 <div 
                                    onClick={() => setIsAd(!isAd)}
                                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${isAd ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                 >
                                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAd ? 'left-7' : 'left-1'}`}></div>
                                 </div>
                             </div>
                         )}

                         {/* 4. Dynamic Inputs */}
                         <div className="space-y-5 animate-fade-in border-t border-slate-100 pt-4">
                            {/* GOOGLE SEO INPUTS */}
                            {platform === 'google' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Meta Title ({metaTitle.length}/60)</label>
                                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                                            value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Meta Description ({metaDesc.length}/160)</label>
                                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 resize-none" 
                                            value={metaDesc} onChange={e => setMetaDesc(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Display URL</label>
                                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                                            value={urlSlug} onChange={e => setUrlSlug(e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                                            {favicon ? <img src={favicon} className="w-full h-full object-contain" /> : <Globe size={16} className="text-slate-300"/>}
                                        </div>
                                        <label className="text-xs font-bold text-indigo-600 cursor-pointer hover:underline">
                                            Upload Favicon <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'favicon')} />
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-700">Rich Snippets</span>
                                        <input type="checkbox" checked={showRichSnippets} onChange={e => setShowRichSnippets(e.target.checked)} className="accent-indigo-600 w-4 h-4"/>
                                    </div>
                                </>
                            ) : (
                                /* SOCIAL MEDIA INPUTS */
                                <>
                                    {/* Profile */}
                                    <div className="flex gap-4 items-center">
                                        <div className="relative w-14 h-14 shrink-0 group">
                                            <div className="w-full h-full rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                                                {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300"/>}
                                            </div>
                                            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer text-white transition-opacity">
                                                <Upload size={16} />
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Tên hiển thị</label>
                                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold" 
                                                value={username} onChange={e => setUsername(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Caption */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nội dung bài viết</label>
                                        <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 resize-none focus:outline-none focus:border-indigo-500" 
                                            value={caption} onChange={e => setCaption(e.target.value)} />
                                    </div>

                                    {/* Media Upload (Single vs Carousel) */}
                                    {format === 'carousel' ? (
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ảnh Carousel (Max 10)</label>
                                            <div className="grid grid-cols-4 gap-2 mb-2">
                                                {carouselImages.map((img, idx) => (
                                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button 
                                                            onClick={() => setCarouselImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X size={12}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                {carouselImages.length < 10 && (
                                                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                                                        <Plus size={20} className="text-slate-400"/>
                                                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'carousel')} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Media (Ảnh/Video Thumb)</label>
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative group">
                                                {mediaImage ? (
                                                    <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                                                        <img src={mediaImage} className="w-full h-full object-contain" />
                                                        <button onClick={() => setMediaImage(null)} className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-sm hover:text-red-500"><X size={14}/></button>
                                                    </div>
                                                ) : (
                                                    <label className="cursor-pointer block py-4">
                                                        <Upload size={24} className="mx-auto text-slate-300 mb-2"/>
                                                        <span className="text-sm text-slate-500 font-medium">Click tải ảnh lên</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'media')} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ad Fields */}
                                    {isAd && (
                                        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Website URL</label>
                                                <input className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs" 
                                                    value={website} onChange={e => setWebsite(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Call to Action</label>
                                                <select className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                                                    value={ctaText} onChange={e => setCtaText(e.target.value as CTA)}>
                                                    {['Learn More', 'Shop Now', 'Sign Up', 'Book Now', 'Contact Us', 'Download', 'Apply Now', 'Send Message', 'Order Now', 'Subscribe'].map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Platform Specific Extras */}
                                    {platform === 'tiktok' && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sound Name</label>
                                                <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                                                    value={soundName} onChange={e => setSoundName(e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Favorites</label>
                                                    <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={favorites} onChange={e => setFavorites(e.target.value)} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(platform === 'facebook' || platform === 'instagram') && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thời gian đăng</label>
                                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                                                value={postTime} onChange={e => setPostTime(e.target.value)} disabled={isAd} />
                                        </div>
                                    )}

                                    {platform === 'facebook' && (
                                         <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Reactions (Max 3)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.keys(FbIcons).map(reaction => (
                                                    <button 
                                                        key={reaction}
                                                        onClick={() => toggleFbReaction(reaction)}
                                                        className={`p-1.5 rounded-lg border ${fbReactions.includes(reaction) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 opacity-50'}`}
                                                    >
                                                        {FbIcons[reaction]}
                                                    </button>
                                                ))}
                                            </div>
                                         </div>
                                    )}

                                    {/* Standard Metrics */}
                                    <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Likes</label>
                                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={likes} onChange={e => setLikes(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Comments</label>
                                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={comments} onChange={e => setComments(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shares</label>
                                            <input className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={shares} onChange={e => setShares(e.target.value)} />
                                        </div>
                                    </div>
                                </>
                            )}
                         </div>

                     </div>
                 </div>

                 {/* RIGHT: LIVE PREVIEW CANVAS */}
                 <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
                     <div className="absolute top-4 right-4 z-30">
                         <button 
                            onClick={handleDownload}
                            disabled={isExporting}
                            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                         >
                             {isExporting ? <Loader2 className="animate-spin" size={20}/> : <Download size={20} />} 
                             {isExporting ? 'Đang xử lý...' : 'Tải ảnh PNG'}
                         </button>
                     </div>

                     <div className="flex-1 overflow-auto flex items-center justify-center p-10 custom-scrollbar">
                         <div 
                            ref={previewRef}
                            className="transition-all duration-300 origin-center"
                         >
                             {/* Wrapper for capture padding */}
                             <div className="p-8"> 
                                 {platform === 'facebook' && renderFacebook()}
                                 {platform === 'instagram' && renderInstagram()}
                                 {platform === 'tiktok' && renderTikTok()}
                                 {platform === 'threads' && renderThreads()}
                                 {platform === 'google' && renderGoogle()}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// --- Custom Icons Components for Layouts ---
const SendIcon = ({ className }: {className?: string}) => (
    <svg aria-label="Share Post" className={className} color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="2" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
)
const RefreshCcwIcon = () => (
    <svg aria-label="Repost" color="currentColor" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20"><path d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.99.99 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z"></path></svg>
)

export default MockupGenerator;