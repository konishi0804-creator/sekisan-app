import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'EstiRE | 不動産リフォーム積算AI'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0f172a',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        fontSize: 80,
                        fontWeight: 900,
                        color: '#fbbf24',
                        marginBottom: 20,
                        letterSpacing: '-0.02em',
                    }}
                >
                    EstiRE
                </div>
                <div
                    style={{
                        fontSize: 40,
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '0.1em',
                    }}
                >
                    不動産総合AIツール
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
