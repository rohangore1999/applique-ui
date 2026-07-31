import * as React from 'react'

type ImageSource =
  | string
  | {
      height?: number
      src: string
      width?: number
    }

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  blurDataURL?: string
  fill?: boolean
  height?: number | `${number}`
  loader?: (options: {
    src: string
    width: number
    quality?: number
  }) => string
  placeholder?: 'blur' | 'empty' | `data:image/${string}`
  priority?: boolean
  quality?: number | `${number}`
  src: ImageSource
  unoptimized?: boolean
  width?: number | `${number}`
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      blurDataURL: _blurDataURL,
      fill,
      height,
      loader,
      placeholder: _placeholder,
      priority: _priority,
      quality,
      src,
      style,
      unoptimized: _unoptimized,
      width,
      ...props
    },
    ref
  ) => {
    const source = typeof src === 'string' ? src : src.src
    const resolvedWidth = Number(width || (typeof src === 'object' && src.width)) || 0
    const resolvedSource = loader
      ? loader({
          quality: quality ? Number(quality) : undefined,
          src: source,
          width: resolvedWidth,
        })
      : source

    return (
      <img
        ref={ref}
        src={resolvedSource}
        width={fill ? undefined : width || (typeof src === 'object' ? src.width : undefined)}
        height={
          fill ? undefined : height || (typeof src === 'object' ? src.height : undefined)
        }
        style={
          fill
            ? {
                height: '100%',
                inset: 0,
                objectFit: 'cover',
                position: 'absolute',
                width: '100%',
                ...style,
              }
            : style
        }
        {...props}
      />
    )
  }
)
Image.displayName = 'CatalogueNextImage'

export default Image
