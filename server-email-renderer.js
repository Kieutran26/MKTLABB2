export const generateEmailHTML = (doc) => {
    if (!doc || !doc.settings || !doc.blocks) return '';
    const { settings, blocks } = doc;

    const toHtml = (b) => {
        switch (b.type) {
            case 'heading': return `<${b.level} style="margin:0 0 16px;font-size:${b.level === 'h1' ? '28px' : '20px'};font-weight:bold;text-align:${b.alignment};color:${b.color};font-family:${settings.fontFamily};">${b.content}</${b.level}>`;
            case 'text': return `<div style="margin:0 0 16px;text-align:${b.alignment};color:#4b5563;font-family:${settings.fontFamily};line-height:1.5;">${b.content}</div>`;
            case 'image': return `<div style="text-align:${b.alignment};margin:16px 0;"><img src="${b.src}" alt="${b.alt}" style="max-width:100%;border-radius:8px;" /></div>`;
            case 'button': return `<div style="text-align:${b.alignment};margin:24px 0;"><a href="${b.url}" style="display:inline-block;background:${b.backgroundColor};color:${b.textColor};padding:12px 32px;border-radius:${b.borderRadius}px;text-decoration:none;font-weight:bold;font-family:${settings.fontFamily};">${b.label}</a></div>`;
            case 'spacer': return `<div style="height:${b.height}px;"></div>`;
            case 'divider': return `<hr style="border:none;border-top:1px ${b.style} ${b.color};margin:24px 0;" />`;
            case 'social': return `<div style="text-align:${b.alignment};margin:24px 0;">
                ${b.platforms.map((p) => {
                const icons = {
                    Facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>',
                    Twitter: '<path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>',
                    Instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>',
                    LinkedIn: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>',
                    YouTube: '<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>',
                    TikTok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v4a9 9 0 0 1-9-9v17"></path>',
                    Website: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
                };
                const content = icons[p.name] || icons['Website'];
                return `<a href="${p.url}" style="display:inline-block;width:32px;height:32px;line-height:32px;background:#e5e7eb;color:#4b5563;border-radius:50%;text-align:center;text-decoration:none;margin:0 4px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align:middle;" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            ${content}
                        </svg>
                    </a>`;
            }).join('')}
            </div>`;
            case 'link': return `<div style="text-align:${b.alignment};margin:16px 0;"><a href="${b.url}" style="color:${b.color};text-decoration:underline;font-family:${settings.fontFamily};">${b.text}</a></div>`;
            case 'row2': return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${b.children.map(cells => `<tr><td style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${cells.map(c => toHtml(c)).join('')}</td></tr>`).join('')}</table>`;
            case 'row3': return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${b.children.map(cells => `<tr><td style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${cells.map(c => toHtml(c)).join('')}</td></tr>`).join('')}</table>`;
            case 'column2': return `<table width="100%" cellpadding="0" cellspacing="8" style="margin:16px 0;"><tr>${b.children.map(cells => `<td width="50%" style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;vertical-align:top;">${cells.map(c => toHtml(c)).join('')}</td>`).join('')}</tr></table>`;
            case 'column3': return `<table width="100%" cellpadding="0" cellspacing="8" style="margin:16px 0;"><tr>${b.children.map(cells => `<td width="33%" style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;vertical-align:top;">${cells.map(c => toHtml(c)).join('')}</td>`).join('')}</tr></table>`;
            case 'html': return b.content;
            case 'video': return `<div style="text-align:${b.alignment};margin:16px 0;"><a href="${b.url}" target="_blank"><div style="position:relative;display:inline-block;"><img src="${b.thumbnail || 'https://placehold.co/600x337/333/FFF?text=PLAY+VIDEO'}" alt="${b.alt}" style="max-width:100%;border-radius:8px;" /><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;background:rgba(255,255,255,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;">▶</div></div></a></div>`;
            case 'header':
                return `<div style="background:${b.colors.background};padding:24px;display:flex;flex-direction:${b.layout === 'stacked' ? 'column' : 'row'};align-items:center;justify-content:${b.layout === 'stacked' ? 'center' : 'space-between'};gap:16px;font-family:${settings.fontFamily};">
                        <div style="display:flex;flex-direction:column;align-items:${b.layout === 'stacked' ? 'center' : 'flex-start'};">
                            ${b.logoSrc ? `<img src="${b.logoSrc}" alt="Logo" style="height:40px;display:block;margin-bottom:4px;" />` : b.companyName ? `<div style="font-size:24px;font-weight:bold;color:${b.colors.companyName};line-height:1;">${b.companyName}</div>` : `<div style="background:#e5e7eb;color:#6b7280;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:4px;">LOGO</div>`}
                            ${b.tagline ? `<div style="font-size:14px;color:${b.colors.tagline};margin-top:4px;">${b.tagline}</div>` : ''}
                        </div>
                        ${b.showMenu ? `<div style="margin-top:${b.layout === 'stacked' ? '16px' : '0'};text-align:${b.layout === 'stacked' ? 'center' : 'right'};">${b.navLinks.map(l => `<a href="${l.url}" style="margin:0 10px;color:${b.colors.menu};text-decoration:none;font-size:14px;font-weight:500;">${l.text}</a>`).join('')}</div>` : ''}
                    </div>`;
            case 'footer': return `
                    <div style="background:${b.backgroundColor};padding:32px 24px;text-align:center;font-family:${settings.fontFamily};">
                        ${b.logoUrl ? `<img src="${b.logoUrl}" alt="Company Logo" style="height:32px;margin:0 auto 16px;display:block;" />` : ''}
                        
                        <div style="margin-bottom:24px;">
                            ${b.companyName ? `<div style="font-weight:bold;color:#1f2937;margin-bottom:4px;">${b.companyName}</div>` : ''}
                            <div style="font-size:12px;color:#6b7280;line-height:1.5;">
                                ${b.address ? `<div>${b.address}</div>` : ''}
                                ${b.companyEmail ? `<div>${b.companyEmail}</div>` : ''}
                                ${b.phone ? `<div>${b.phone}</div>` : ''}
                            </div>
                        </div>

                        ${b.socialLinks.length > 0 ? `
                            <div style="margin-bottom:24px;">
                                ${b.socialLinks.map(s => {
                const sizeMap = { small: '24px', medium: '32px', large: '40px' };
                const radMap = { circle: '50%', square: '0', rounded: '8px' };
                const size = sizeMap[b.socialIconSize || 'medium'] || '32px';
                const rad = radMap[b.socialIconStyle || 'circle'] || '50%';
                const iconSize = parseInt(size) - 12;

                const icons = {
                    Facebook: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>',
                    Twitter: '<path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>',
                    Instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>',
                    LinkedIn: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>',
                    YouTube: '<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>',
                    TikTok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v4a9 9 0 0 1-9-9v17"></path>',
                    Website: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
                };
                const content = icons[s.name] || icons['Website'];

                return `<a href="${s.url}" style="display:inline-block;width:${size};height:${size};line-height:${size};background:#e5e7eb;color:#4b5563;border-radius:${rad};text-align:center;text-decoration:none;margin:0 4px;">
                                        <svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" style="vertical-align:middle;" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                            ${content}
                                        </svg>
                                    </a>`;
            }).join('')}
                            </div>
                        ` : ''}

                        <div style="border-top:1px solid #e5e7eb;padding-top:24px;">
                             <div style="font-size:12px;color:#9ca3af;margin-bottom:12px;">${(b.copyrightText && !b.copyrightText.startsWith('©')) ? '© ' : ''}${b.copyrightText || ''}</div>
                             <div style="font-size:12px;color:#9ca3af;">
                                ${b.privacyUrl ? `<a href="${b.privacyUrl}" style="color:#6b7280;text-decoration:underline;margin:0 8px;">Privacy Policy</a>` : ''}
                                ${b.termsUrl ? `<a href="${b.termsUrl}" style="color:#6b7280;text-decoration:underline;margin:0 8px;">Terms of Service</a>` : ''}
                                ${b.unsubscribeUrl ? `<a href="${b.unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;margin:0 8px;">${b.unsubscribeText || 'Unsubscribe'}</a>` : ''}
                             </div>
                        </div>
                    </div>`;
            case 'product': return `
                    <div style="background:${b.backgroundColor};border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;text-align:center;position:relative;font-family:${settings.fontFamily};">
                        ${b.badge ? `<div style="position:absolute;top:16px;left:16px;background:${b.colors?.badge || '#ef4444'};color:#fff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:999px;z-index:10;">${b.badge}</div>` : ''}
                        
                        <div style="position:relative;">
                            ${b.productImage ?
                    `<img src="${b.productImage}" alt="${b.title}" style="width:100%;height:224px;object-fit:cover;display:block;" />` :
                    `<div style="width:100%;height:224px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Product Image</div>`
                }
                            ${!b.inStock ? `<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Out of Stock</div>` : ''}
                        </div>
                        
                        <div style="padding:24px;">
                            <h3 style="margin:0 0 8px;font-size:${b.titleFontSize || 20}px;color:${b.colors?.text || '#1f2937'};font-weight:bold;line-height:1.25;">${b.title}</h3>
                            
                            ${(b.rating !== undefined && !(b.rating === 5 && (!b.reviewCount || b.reviewCount === 0))) ? `
                                <div style="display:flex;align-items:center;justify-content:center;gap:4px;margin-bottom:12px;">
                                    <span style="color:#facc15;font-size:14px;">${'★'.repeat(b.rating || 5)}${'☆'.repeat(5 - (b.rating || 5))}</span>
                                    ${b.reviewCount ? `<span style="font-size:12px;color:#9ca3af;">(${b.reviewCount} reviews)</span>` : ''}
                                </div>
                            ` : ''}
                            
                            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;">
                                <span style="font-size:18px;font-weight:bold;color:${b.colors?.price || '#1f2937'};">${b.price}</span>
                                <span style="font-size:14px;color:#9ca3af;text-decoration:line-through;">${b.originalPrice || ''}</span>
                                ${b.discount ? `<span style="font-size:12px;font-weight:bold;color:#ef4444;background:#fef2f2;padding:2px 6px;border-radius:4px;">-${b.discount}%</span>` : ''}
                            </div>
                            
                            <p style="color:#6b7280;font-size:14px;margin-bottom:16px;line-height:1.5;">${b.description}</p>
                            
                            <a href="${b.url}" style="display:block;width:100%;background:${b.buttonColor};color:${b.colors?.buttonText || '#fff'};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;text-align:center;">
                                ${b.buttonText}
                            </a>
                        </div>
                    </div>`;
            case 'unsubscribe': return `
                    <div style="background:${b.colors?.background || 'transparent'};text-align:${b.alignment};padding:16px;font-family:${settings.fontFamily};">
                        <div style="font-size:${b.fontSize || 12}px;color:${b.colors?.text || '#6b7280'};margin-bottom:8px;">${b.text}</div>
                        <a href="${b.url}" style="display:inline-block;font-size:${b.fontSize || 12}px;color:${b.colors?.link || '#3b82f6'};text-decoration:none;font-weight:500;">
                            ${b.linkText}
                        </a>
                    </div>`;

            default: return '';
        }
    };

    return `
<!DOCTYPE html>
<html lang="vi" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style>
        :root { color-scheme: light; supported-color-schemes: light; }
        body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: ${settings.backgroundColor}; font-family: ${settings.fontFamily}; }
        img { border: 0; outline: none; text-decoration: none; display: block; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        a { color: ${settings.primaryColor}; text-decoration: underline; }
        /* Mobile Styles */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 15px !important; }
            .mobile-padding { padding: 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${settings.backgroundColor};">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${settings.backgroundColor};">
        <tr>
            <td align="center" style="padding: 40px 0;" class="mobile-padding">
                <!--[if gte mso 9]>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${settings.contentWidth}"><tr><td valign="top">
                <![endif]-->
                <div style="width: 100%; max-width: ${settings.contentWidth}px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    ${blocks.map(b => toHtml(b)).join('')}
                </div>
                <!--[if gte mso 9]>
                </td></tr></table>
                <![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>`;
};
