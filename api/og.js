import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters from URL
    const title = searchParams.get('title') || 'rohiitspace';
    const description = searchParams.get('description') || 'Computer science grad building fullstack apps, computer vision solutions, and automation tools.';
    const type = searchParams.get('type') || 'default'; // 'blog' or 'default'
    const tags = searchParams.get('tags') || '';

    // Parse tags if provided
    const tagsList = tags ? tags.split(',').slice(0, 3) : [];

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            padding: '80px',
            fontFamily: 'monospace',
          }}
        >
          {/* Top branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '60px',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#6366f1',
                letterSpacing: '-0.02em',
              }}
            >
              rohiitspace
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: type === 'blog' ? '60px' : '72px',
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: '30px',
                maxWidth: '90%',
              }}
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '28px',
                color: '#9ca3af',
                lineHeight: 1.5,
                maxWidth: '85%',
                marginBottom: tagsList.length > 0 ? '40px' : '0',
              }}
            >
              {description}
            </p>

            {/* Tags for blog posts */}
            {tagsList.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {tagsList.map((tag, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: index === 0 ? '#6366f1' : '#1f2937',
                      color: index === 0 ? '#fff' : '#9ca3af',
                      padding: '12px 24px',
                      borderRadius: '24px',
                      fontSize: '20px',
                      fontWeight: '500',
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom accent line */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                height: '4px',
                width: '200px',
                background: 'linear-gradient(to right, #6366f1, transparent)',
                borderRadius: '2px',
              }}
            />
            <div
              style={{
                fontSize: '20px',
                color: '#6b7280',
              }}
            >
              rohiit.space
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
