import React, { useState, useEffect, useRef } from 'react';
import { CardSvgBackground } from './CardSvgBackground';
import { AgriStackSvgBackground } from './AgriStackSvgBackground';
import { User, Lock, Move, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { resolveQrPayload } from '../services/qrHelper';
import { getMarathiAddress, getEnglishAddress, cleanVillageName, cleanTalukaName } from '../utils/marathiAddress';

/**
 * Dynamic QR Code Component
 * Resolves payload dynamically from the current local farmer at render time.
 * Renders a complete, unclipped, vector SVG QR code (Width = Height square).
 * Has minimum 4-module quiet zone, crisp edges, and zero anti-aliasing blur.
 * If data is missing, cleanly displays a safe fallback message (never a fake or partial QR).
 */
export const QrCodeElement = ({ element, template, farmer, style = {} }) => {
  const effectiveQrConfig = {
    sourceType: element.sourceType || template?.qrConfig?.sourceType || 'field',
    sourceField: element.sourceField || template?.qrConfig?.sourceField || 'farmer_id',
    errorCorrection: element.errorCorrection || element.errorCorrectionLevel || template?.qrConfig?.errorCorrection || template?.qrConfig?.errorCorrectionLevel || 'Q',
    size: element.size || template?.qrConfig?.size || 20,
    margin: element.margin ?? template?.qrConfig?.margin ?? 4,
    foregroundColor: element.foregroundColor || element.style?.foregroundColor || template?.qrConfig?.foregroundColor || '#000000',
    backgroundColor: element.backgroundColor || element.style?.backgroundColor || template?.qrConfig?.backgroundColor || '#FFFFFF',
    caption: element.caption !== undefined ? element.caption : (element.style?.caption !== undefined ? element.style.caption : (template?.qrConfig?.caption ?? '')),
    captionFontSize: element.captionFontSize || element.style?.captionFontSize || template?.qrConfig?.captionFontSize || 10.5,
    multipleFields: element.multipleFields || template?.qrConfig?.multipleFields,
    customText: element.customText || template?.qrConfig?.customText,
    urlPattern: element.urlPattern || template?.qrConfig?.urlPattern
  };

  const resolved = resolveQrPayload(effectiveQrConfig, farmer);

  if (resolved.isMissing || !resolved.payload) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center text-center p-2 rounded shadow-sm"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#FFFBEB',
          borderColor: '#FCD34D',
          borderWidth: `${style.borderWidth || 1.5}px`,
          borderStyle: 'dashed',
          borderRadius: `${style.borderRadius || 10}px`
        }}
      >
        <AlertTriangle size={16} className="text-amber-600 mb-0.5 flex-shrink-0" />
        <span className="text-[9.5px] font-bold text-amber-900 leading-tight px-1">
          {resolved.message || `QR unavailable — ${resolved.missingField || 'Farmer ID'} is missing.`}
        </span>
      </div>
    );
  }

  // Calculate exact square dimensions for the QR code
  // Element dimensions: default width = 144px, height = 160px
  const elWidth = Number(element.width || 144);
  const elHeight = Number(element.height || 160);
  const padding = Number(style.padding !== undefined ? style.padding : 6);
  const borderWidth = Number(style.borderWidth !== undefined ? style.borderWidth : 1.5);

  // Calculate inner printable space
  const availInnerWidth = Math.max(20, elWidth - (padding * 2) - (borderWidth * 2));
  const hasCaption = Boolean(effectiveQrConfig.caption && String(effectiveQrConfig.caption).trim());
  const captionFontSize = Number(effectiveQrConfig.captionFontSize || 10.5);
  const captionHeight = hasCaption ? (captionFontSize + 6) : 0;
  const availInnerHeight = Math.max(20, elHeight - (padding * 2) - (borderWidth * 2) - captionHeight);

  // Exact Square rule: Width = Height, fitted strictly inside container
  const qrSquareSize = Math.floor(Math.min(availInnerWidth, availInnerHeight));
  const marginModules = Number(effectiveQrConfig.margin ?? 4);

  return (
    <div
      className={`flex flex-col items-center ${hasCaption ? 'justify-between' : 'justify-center'}`}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: effectiveQrConfig.backgroundColor || '#FFFFFF',
        borderColor: style.borderColor || '#C7D9CD',
        borderWidth: `${borderWidth}px`,
        borderStyle: 'solid',
        borderRadius: `${style.borderRadius || 24}px`,
        padding: `${padding}px`,
        overflow: 'visible' // Prevent clipping of the QR code
      }}
    >
      {/* Complete Square QR Container */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: `${qrSquareSize}px`,
          height: `${qrSquareSize}px`,
          aspectRatio: '1 / 1',
          boxSizing: 'border-box',
          overflow: 'visible'
        }}
      >
        <QRCodeSVG
          value={resolved.payload}
          size={qrSquareSize}
          width={qrSquareSize}
          height={qrSquareSize}
          level={effectiveQrConfig.errorCorrection || 'Q'}
          bgColor={effectiveQrConfig.backgroundColor || '#FFFFFF'}
          fgColor={effectiveQrConfig.foregroundColor || '#000000'}
          marginSize={marginModules}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: 'block',
            width: `${qrSquareSize}px`,
            height: `${qrSquareSize}px`,
            aspectRatio: '1 / 1',
            shapeRendering: 'crispEdges'
          }}
        />
      </div>

      {/* Caption Text Element */}
      {hasCaption && (
        <span
          style={{
            fontSize: `${captionFontSize}px`,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            color: '#263C36',
            letterSpacing: '0.8px',
            marginTop: '2px',
            lineHeight: 1,
            textAlign: 'center',
            userSelect: 'none'
          }}
        >
          {effectiveQrConfig.caption}
        </span>
      )}
    </div>
  );
};

export const CardRenderer = ({
  template,
  side = 'front',
  farmer = {},
  scale = 1,
  interactive = false,
  selectedElementId = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  backgroundMode = 'vector', // 'vector' | 'reference'
  showShadow = true // Preview presentation soft shadow (disabled in print)
}) => {
  const containerRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  const sideConfig = side === 'front' ? template?.front : template?.back;
  const elements = sideConfig?.elements || [];

  // Handle Dragging in Interactive (Editor) Mode
  const handleMouseDown = (e, element) => {
    if (!interactive || element.locked) return;
    e.stopPropagation();
    onSelectElement(element.id);

    setDragState({
      elementId: element.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: element.x,
      origY: element.y
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e) => {
      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;

      const element = elements.find((el) => el.id === dragState.elementId);
      if (element) {
        onUpdateElement({
          ...element,
          x: Math.round(Math.max(0, Math.min(856 - element.width, dragState.origX + dx))),
          y: Math.round(Math.max(0, Math.min(540 - element.height, dragState.origY + dy)))
        });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, scale, elements, onUpdateElement]);

  const canvasWidth = 856;
  const canvasHeight = 540;

  return (
    <div
      ref={containerRef}
      className="card-renderer-root relative select-none print:shadow-none"
      data-card-side={side}
      style={{
        width: `${canvasWidth * scale}px`,
        height: `${canvasHeight * scale}px`,
        borderRadius: `${32 * scale}px`,
        boxShadow: showShadow ? '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)' : 'none',
        transformOrigin: 'top left',
        transition: 'box-shadow 0.25s ease'
      }}
      onClick={() => interactive && onSelectElement(null)}
    >
      <div
        className="card-inner card-outer-shell absolute inset-0 overflow-hidden"
        data-card-side={side}
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          borderRadius: '32px',
          backgroundColor: sideConfig?.background?.color || '#FBF8EE',
          border: '1px solid #DCE7D7',
          boxSizing: 'border-box'
        }}
      >
        {/* Background Layer */}
        {backgroundMode === 'reference' ? (
          <img
            src={side === 'front' ? '/card_front_exact.png' : '/card_back_exact.png'}
            alt="Reference Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <CardSvgBackground side={side} config={sideConfig?.background || {}} />
        )}

        {/* Dynamic Elements Layer */}
        {elements.map((el) => {
          if (el.hidden && !interactive) return null;
          const isSelected = interactive && selectedElementId === el.id;
          return (
            <div
              key={el.id}
              onClick={(e) => {
                if (interactive) {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }
              }}
              onMouseDown={(e) => handleMouseDown(e, el)}
              className={`absolute transition-all ${
                interactive ? (el.locked ? 'cursor-not-allowed' : 'cursor-move') : ''
              } ${
                isSelected
                  ? 'ring-2 ring-emerald-600 ring-offset-2 ring-offset-amber-50 shadow-md'
                  : interactive && !el.locked
                  ? 'hover:ring-1 hover:ring-emerald-400/50'
                  : ''
              } ${el.hidden ? 'opacity-40 border border-dashed border-amber-500/70' : ''}`}
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: el.width ? `${el.width}px` : 'auto',
                height: el.type === 'table' ? 'auto' : (el.height ? `${el.height}px` : 'auto'),
                transform: el.rotation ? `rotate(${el.rotation}deg)` : 'none',
                zIndex: isSelected ? 30 : 10,
                boxSizing: 'border-box'
              }}
            >
              {renderElementContent(el, farmer, template, side)}

              {/* Selection indicators in editor mode */}
              {isSelected && (
                <div className="absolute -top-6 left-0 bg-emerald-800 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1 z-40 pointer-events-none">
                  {el.locked ? <Lock size={10} /> : <Move size={10} />}
                  <span>{el.name || el.type}</span>
                  <span className="text-emerald-300">({el.x},{el.y})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Render Individual Element types based on JSON definition
function renderElementContent(el, farmer, template, side = 'front') {
  const style = el.style || {};

  switch (el.type) {
    case 'image':
    case 'logo': {
      const src =
        el.src ||
        el.imageUrl ||
        el.url ||
        (el.assetId === 'agristack-logo' ? '/agristack_logo.png' : '/agristack_logo.png');
      return (
        <div
          className="w-full h-full flex items-center justify-center overflow-hidden select-none"
          style={{
            opacity: style.opacity ?? 1,
            borderRadius: `${style.borderRadius || 0}px`,
            backgroundColor: style.backgroundColor || 'transparent',
            padding: `${style.padding || 0}px`
          }}
        >
          {src ? (
            <img
              src={src}
              alt={el.name || 'Logo'}
              className="w-full h-full object-contain pointer-events-none"
              style={{
                filter: style.filter || 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center border border-dashed border-emerald-400 bg-emerald-50/50 text-[10px] font-bold text-emerald-800">
              {el.name || 'Logo'}
            </div>
          )}
        </div>
      );
    }

    case 'badge':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: style.backgroundColor || '#205E37',
            color: style.color || '#FFFFFF',
            fontSize: `${style.fontSize || 22}px`,
            fontFamily: style.fontFamily || "'Outfit', sans-serif",
            fontWeight: style.fontWeight || 800,
            letterSpacing: style.letterSpacing || '2px',
            textAlign: style.textAlign || 'left',
            paddingLeft: style.paddingLeft || '24px',
            borderRadius: `${style.borderRadius || 12}px`,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {el.text}
        </div>
      );

    case 'photo': {
      const photoSrc = farmer?.photo_processed || farmer?.photo;
      const photoSettings = farmer?.photo_settings || null;
      const objectPosition = photoSettings?.objectPosition || (
        photoSettings
          ? `${Math.round(50 + (photoSettings.panX || 0))}% ${Math.round(50 + (photoSettings.panY || 0))}%`
          : 'center center'
      );
      const zoomScale = !farmer?.photo_processed && photoSettings?.zoom ? photoSettings.zoom : 1.0;
      const filterCss = !farmer?.photo_processed && photoSettings
        ? `brightness(${photoSettings.brightness || 100}%) contrast(${photoSettings.contrast || 100}%)`
        : 'none';

      return (
        <div
          className="relative overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: style.backgroundColor || '#FAF6ED',
            borderColor: style.borderColor || '#C7D9CD',
            borderWidth: `${style.borderWidth || 1.5}px`,
            borderStyle: style.borderStyle || 'solid',
            borderRadius: `${style.borderRadius || 24}px`,
            boxSizing: 'border-box',
            padding: 0,
            margin: 0
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={farmer?.name_english ? `${farmer.name_english} Photograph` : 'Farmer Photograph'}
              className="w-full h-full object-cover block select-none pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition,
                transform: zoomScale > 1.0 ? `scale(${zoomScale})` : 'none',
                transformOrigin: objectPosition,
                filter: filterCss,
                display: 'block',
                margin: 0,
                padding: 0,
                border: 'none'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-1.5 p-2">
              <div className="w-16 h-16 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-400">
                <User size={38} />
              </div>
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: '13px',
                  letterSpacing: '1.5px',
                  color: '#64748B'
                }}
              >
                PHOTO
              </span>
            </div>
          )}
        </div>
      );
    }

    case 'field_container':
      return (
        <div className="w-full h-full flex flex-col justify-center items-center">
          {el.label ? (
            <div
              style={{
                fontSize: `${style.labelFontSize || 11}px`,
                fontFamily: style.labelFontFamily || "'Plus Jakarta Sans', sans-serif",
                fontWeight: style.labelFontWeight || 800,
                color: style.labelColor || '#1F633F',
                letterSpacing: style.letterSpacing || '1.5px',
                marginBottom: '3px',
                textTransform: 'uppercase'
              }}
            >
              {el.label}
            </div>
          ) : null}
          <div
            className="flex items-center justify-center"
            style={{
              width: '100%',
              height: el.label ? `${(el.height || 60) - 22}px` : '100%',
              backgroundColor: style.containerBg || '#FFFFFF',
              borderColor: style.containerBorderColor || '#A4CBB0',
              borderWidth: `${style.containerBorderWidth !== undefined ? style.containerBorderWidth : 1.2}px`,
              borderStyle: 'solid',
              borderRadius: `${style.containerBorderRadius || 26}px`,
              padding: '0 18px',
              boxShadow: style.boxShadow || 'none'
            }}
          >
            {style.prefix ? (
              <span
                style={{
                  fontSize: `${Math.max(13, (style.valueFontSize || 28) - 13)}px`,
                  fontFamily: style.labelFontFamily || "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  color: style.prefixColor || '#1F5C3A',
                  letterSpacing: '1.5px',
                  marginRight: '8px',
                  opacity: 0.95
                }}
              >
                {style.prefix}
              </span>
            ) : null}
            <span
              style={{
                fontSize: `${style.valueFontSize || 26}px`,
                fontFamily: style.valueFontFamily || "'Plus Jakarta Sans', monospace",
                fontWeight: style.valueFontWeight || 800,
                color: style.valueColor || '#1F5C3A',
                letterSpacing: style.letterSpacing || '2px',
                textAlign: style.textAlign || 'center'
              }}
            >
              {farmer?.[el.field] || '•••• •••• ••••'}
            </span>
          </div>
        </div>
      );

    case 'field':
      const value = farmer?.[el.field] || '—';
      if (style.layout === 'inline') {
        return (
          <div className="w-full h-full flex items-baseline gap-1.5 truncate">
            {el.label && (
              <span
                style={{
                  fontSize: `${style.labelFontSize || 11}px`,
                  fontFamily: style.labelFontFamily || "'Plus Jakarta Sans', sans-serif",
                  fontWeight: style.labelFontWeight || 700,
                  color: style.labelColor || '#5B6A65',
                  letterSpacing: style.labelLetterSpacing || 'normal',
                  whiteSpace: 'nowrap'
                }}
              >
                {el.label} :
              </span>
            )}
            <span
              className="truncate font-bold"
              style={{
                fontSize: `${style.valueFontSize || 14}px`,
                fontFamily: style.valueFontFamily || "'Plus Jakarta Sans', sans-serif",
                fontWeight: style.valueFontWeight || 700,
                color: style.valueColor || '#263C36'
              }}
            >
              {value}
            </span>
          </div>
        );
      }
      return (
        <div className="w-full h-full flex flex-col justify-start">
          {el.label && (
            <div
              style={{
                fontSize: `${style.labelFontSize || 10.5}px`,
                fontFamily: style.labelFontFamily || "'Plus Jakarta Sans', sans-serif",
                fontWeight: style.labelFontWeight || 700,
                color: style.labelColor || '#5B6A65',
                letterSpacing: style.labelLetterSpacing || '0.5px',
                marginBottom: '2px'
              }}
            >
              {el.label}
            </div>
          )}
          <div
            style={{
              fontSize: `${value && value.length > 24 ? Math.max(12, (style.valueFontSize || 15) - 3) : (style.valueFontSize || 15)}px`,
              fontFamily: style.valueFontFamily || "'Plus Jakarta Sans', 'Mukta', sans-serif",
              fontWeight: style.valueFontWeight || 700,
              color: style.valueColor || '#263C36',
              lineHeight: 1.25,
              wordBreak: 'break-word',
              overflow: 'hidden'
            }}
          >
            {value}
          </div>
          {style.showUnderline === true && (
            <div
              style={{
                height: '1px',
                backgroundColor: style.underlineColor || '#CBD5E1',
                width: '100%',
                marginTop: '3px'
              }}
            />
          )}
        </div>
      );

    case 'address': {
      const addressStyle = el.addressStyle || el.style?.addressStyle || template?.addressStyle || 'compact';
      const englishAddr = getEnglishAddress(farmer);
      const marathiAddr = getMarathiAddress(farmer);

      if (addressStyle === 'detailed') {
        return (
          <div className="w-full h-full flex flex-col justify-start">
            <div
              style={{
                fontSize: `${style.headingFontSize || 11}px`,
                fontFamily: style.fontFamily || "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                color: style.headingColor || '#1F5C3A',
                letterSpacing: '0.8px',
                marginBottom: '4px'
              }}
            >
              {el.label || 'ADDRESS / पत्ता'}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Village / गाव:</span>
                <span className="font-bold text-[#1F3A2B] text-[12px]">{farmer?.village || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Taluka / तालुका:</span>
                <span className="font-bold text-[#1F3A2B] text-[12px]">{farmer?.taluka || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">District / जिल्हा:</span>
                <span className="font-bold text-[#1F3A2B] text-[12px]">{farmer?.district || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Pincode / पिनकोड:</span>
                <span className="font-bold text-[#1F3A2B] text-[12px]">{farmer?.pincode || '—'}</span>
              </div>
            </div>
          </div>
        );
      }

      // Default: Compact Dual-Language Display
      return (
        <div className="w-full h-full flex flex-col justify-center">
          <div
            style={{
              fontSize: `${style.headingFontSize || 11}px`,
              fontFamily: style.fontFamily || "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              color: style.headingColor || '#1F5C3A',
              letterSpacing: '0.8px',
              marginBottom: '3px',
              textTransform: 'uppercase'
            }}
          >
            {el.label || 'ADDRESS / पत्ता'}
          </div>
          <div
            className="flex flex-col gap-1 leading-tight"
            style={{
              color: style.textColor || '#263C36'
            }}
          >
            {/* English Line */}
            <div
              style={{
                fontSize: `${englishAddr.length > 55 ? 11 : (style.fontSize || 12)}px`,
                fontFamily: style.fontFamily || "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                lineHeight: 1.25,
                wordBreak: 'break-word'
              }}
            >
              {englishAddr || '—'}
            </div>
            {/* Marathi Line */}
            <div
              style={{
                fontSize: `${marathiAddr.length > 55 ? 11 : (style.fontSize || 12)}px`,
                fontFamily: "'Noto Sans Devanagari', 'Mukta', sans-serif",
                fontWeight: 700,
                lineHeight: 1.25,
                wordBreak: 'break-word',
                color: style.marathiColor || '#263C36'
              }}
            >
              {marathiAddr || '—'}
            </div>
          </div>
        </div>
      );
    }

    case 'qr':
      return <QrCodeElement element={el} template={template} farmer={farmer} style={style} />;

    case 'table': {
      const config = el.tableConfig || {};
      const columns = config.columns || [
        { key: 'district', label: 'DISTRICT', width: '23%' },
        { key: 'taluka', label: 'TALUKA', width: '16%' },
        { key: 'village', label: 'VILLAGE', width: '16%' },
        { key: 'survey_no', label: 'SURVEY NO.', width: '14%' },
        { key: 'area', label: 'AREA', width: '14%' },
        { key: 'owner_share', label: 'OWNER / SHARE', width: '17%' }
      ];
      const records = farmer?.land_records || [];
      const totalParcels = records.length;

      // Allow displaying up to 5 full records without arbitrarily clipping
      const maxRows = config.maxRows || 5;
      const hasOverflow = totalParcels > maxRows;
      const displayRows = hasOverflow ? records.slice(0, maxRows) : records;

      // Dynamically calculate row height based on number of records (Content Determines Table Height)
      const rowHeight = totalParcels <= 2 ? 35 : totalParcels <= 3 ? 32 : totalParcels <= 4 ? 30 : 28;
      const cellFontSize = totalParcels <= 2 ? 11.5 : totalParcels <= 3 ? 11 : totalParcels <= 4 ? 10.5 : 10;
      const cellPaddingY = totalParcels <= 2 ? '5px' : totalParcels <= 3 ? '4px' : '3px';

      const borderColor = config.borderColor || '#C7D9CD';
      const headerBg = config.headerBg || '#245F3D';
      const headerTextColor = config.headerTextColor || '#FFFFFF';
      const textColor = config.textColor || '#243C34';

      // Column text alignments:
      // DISTRICT (left), TALUKA (left), VILLAGE (left), SURVEY NO. (center), AREA (center), OWNER / SHARE (center)
      const columnAlignments = {
        district: 'left',
        taluka: 'left',
        village: 'left',
        survey_no: 'center',
        area: 'center',
        owner_share: 'center'
      };

      return (
        <div
          className="land-table-wrapper w-full overflow-hidden flex flex-col"
          style={{
            border: `1px solid ${borderColor}`,
            borderRadius: '14px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            fontFamily: config.fontFamily || "'Plus Jakarta Sans', sans-serif"
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'fixed',
              border: 'none',
              margin: 0
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: headerBg,
                  color: headerTextColor,
                  height: '27px'
                }}
              >
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      width: col.width || 'auto',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      fontWeight: 800,
                      fontSize: '10px',
                      letterSpacing: '0.4px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      borderRight: idx < columns.length - 1 ? `1px solid ${borderColor}` : 'none',
                      borderBottom: `1px solid ${borderColor}`,
                      borderTop: 'none',
                      borderLeft: 'none'
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      color: '#64748B',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none'
                    }}
                  >
                    No Land Records in Registry
                  </td>
                </tr>
              ) : (
                displayRows.map((row, rIdx) => {
                  const isBlank = !row.district && !row.survey_no && !row.area;
                  const isLastRow = rIdx === displayRows.length - 1 && !hasOverflow;
                  const rowBg = rIdx % 2 === 0 ? '#FFFFFF' : '#F6FAF6';

                  return (
                    <tr
                      key={rIdx}
                      style={{
                        backgroundColor: rowBg,
                        height: `${rowHeight}px`
                      }}
                    >
                      {columns.map((col, cIdx) => {
                        let cellVal = String(row[col.key] || (isBlank ? '' : '—'));
                        if (col.key === 'village' && cellVal !== '—') {
                          cellVal = cleanVillageName(cellVal) || cellVal;
                        } else if (col.key === 'taluka' && cellVal !== '—') {
                          cellVal = cleanTalukaName(cellVal) || cellVal;
                        }
                        const isVeryLong = cellVal.length > 20;
                        const isLong = cellVal.length > 14;
                        const fontSize = isVeryLong
                          ? Math.max(9, cellFontSize - 1.5)
                          : isLong
                          ? Math.max(9.5, cellFontSize - 1)
                          : cellFontSize;

                        return (
                          <td
                            key={cIdx}
                            style={{
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: cellPaddingY,
                              paddingBottom: cellPaddingY,
                              verticalAlign: 'middle',
                              textAlign: columnAlignments[col.key] || 'left',
                              color: textColor,
                              fontSize: `${fontSize}px`,
                              fontWeight: 600,
                              lineHeight: isLong ? 1.15 : 1.25,
                              wordBreak: 'break-word',
                              borderRight: cIdx < columns.length - 1 ? `1px solid ${borderColor}` : 'none',
                              borderBottom: isLastRow ? 'none' : `1px solid ${borderColor}`,
                              borderTop: 'none',
                              borderLeft: 'none'
                            }}
                          >
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}

              {/* Controlled Overflow Summary Row for > 5 records */}
              {hasOverflow && (
                <tr
                  style={{
                    backgroundColor: '#F4F8F4',
                    height: '26px'
                  }}
                >
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: '3px 8px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      borderTop: 'none',
                      borderBottom: 'none',
                      borderLeft: 'none',
                      borderRight: 'none'
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E2EFE5] text-[#1F5C3A] font-extrabold text-[10px] tracking-wide">
                      + {totalParcels - maxRows} additional land records
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    case 'text':
    default:
      let text = el.text || '';
      // 1. Interpolate {{field}} tokens
      text = text.replace(/\{\{(\w+)\}\}/g, (_, key) => farmer?.[key] || '');

      // 2. Strict guard against "Government of India" (user requested "Farmer ID Card" on front, "FOR PERSONAL USE" on back)
      if (text.includes('Government of India')) {
        text = side === 'front' ? 'Farmer ID Card' : 'FOR PERSONAL USE';
      }

      // 3. Render authentic AgriStack logo for corner branding
      const lower = text.toLowerCase().trim();
      if (
        el.id?.includes('agristack') ||
        lower === 'agristack' ||
        lower === 'agric stack' ||
        lower === 'agristack logo'
      ) {
        return (
          <div
            className="flex items-center select-none"
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${style.fontSize || 25}px`,
              fontFamily: style.fontFamily || "'Outfit', sans-serif",
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}
          >
            <span style={{ color: '#1B5E20' }}>Agri</span>
            <span
              style={{
                color: '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              Stack
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="#2E7D32"
                style={{
                  position: 'absolute',
                  top: '-7px',
                  left: '1px'
                }}
              >
                <path d="M17,8 C8,10 5,16 6,22 C13,20 18,14 17,8 Z" />
              </svg>
            </span>
          </div>
        );
      }

      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${style.fontSize || 14}px`,
            fontFamily: style.fontFamily || "'Outfit', sans-serif",
            fontWeight: style.fontWeight || 600,
            color: style.color || '#0F172A',
            textAlign: style.textAlign || 'left',
            letterSpacing: style.letterSpacing || 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              style.textAlign === 'center'
                ? 'center'
                : style.textAlign === 'right'
                ? 'flex-end'
                : 'flex-start'
          }}
        >
          {text}
        </div>
      );
  }
}
