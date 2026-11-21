<?php

it('links the ring-and-dot mark as the icon on every page, signed in or out', function () {
    $pages = [
        fn () => $this->get('/login'),
        fn () => $this->actingAs(golfer())->get('/'),
    ];

    foreach ($pages as $page) {
        $page()->assertOk()->assertSeeInOrder([
            '<link rel="icon" href="/favicon.ico" sizes="32x32">',
            '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
            '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
        ], false);
    }
});

/** A colour token's value in a theme, from the design system's tokens.json. */
function colourToken(string $name, string $theme): string
{
    $tokens = json_decode(file_get_contents(base_path('../docs/design-system/tokens.json')), true)['color']['tokens'];

    return collect($tokens)->firstWhere('name', $name)['value'][$theme];
}

it('draws the SVG icon in the accent ring and highlight dot of the browser\'s light or dark scheme', function () {
    $svg = file_get_contents(public_path('favicon.svg'));
    [$light, $dark] = explode('@media (prefers-color-scheme: dark)', $svg);

    expect($light)->toContain(colourToken('accent', 'light'), colourToken('highlight', 'light'))
        ->and($dark)->toContain(colourToken('accent', 'dark'), colourToken('highlight', 'dark'));
});

/** An opaque pixel's colour as #RRGGBB, or 'transparent'. */
function pixelColour(int $r, int $g, int $b, int $a): string
{
    return $a === 255 ? sprintf('#%02X%02X%02X', $r, $g, $b) : 'transparent';
}

/** The colour of pixel ($x, $y), counted from the top left, in the 32px image of an .ico of 32-bit bitmaps. */
function icoPixel(string $ico, int $x, int $y): string
{
    $count = unpack('v', $ico, 4)[1];
    $entry = collect(range(0, $count - 1))
        ->map(fn ($i) => unpack('Cwidth/x5/vbits/x4/Voffset', $ico, 6 + 16 * $i))
        ->firstWhere('width', 32);
    expect($entry['bits'])->toBe(32);

    // Rows run bottom to top, after the 40-byte header, in blue, green, red, alpha.
    [, $b, $g, $r, $a] = unpack('C4', $ico, $entry['offset'] + 40 + ((31 - $y) * 32 + $x) * 4);

    return pixelColour($r, $g, $b, $a);
}

it('gives a browser that asks for /favicon.ico the mark on the dark ground, readable on light and dark tabs', function () {
    $ico = file_get_contents(public_path('favicon.ico'));

    expect(substr($ico, 0, 4))->toBe("\0\0\1\0")
        ->and(icoPixel($ico, 16, 16))->toBe(colourToken('highlight', 'dark'))
        ->and(icoPixel($ico, 6, 16))->toBe(colourToken('accent', 'dark'))
        ->and(icoPixel($ico, 2, 16))->toBe(colourToken('background', 'dark'))
        ->and(icoPixel($ico, 0, 0))->toBe('transparent');
});

/** The colour of pixel ($x, $y), counted from the top left, in an 8-bit RGBA .png. */
function pngPixel(string $png, int $x, int $y): string
{
    expect(substr($png, 0, 8))->toBe("\x89PNG\r\n\x1a\n");
    $header = unpack('Nwidth/Nheight/Cdepth/Ctype', $png, 16);
    expect([$header['depth'], $header['type']])->toBe([8, 6]);

    $data = '';
    for ($at = 8; $at < strlen($png); $at += 12 + $length) {
        $length = unpack('N', $png, $at)[1];
        $kind = substr($png, $at + 4, 4);
        if ($kind === 'IDAT') {
            $data .= substr($png, $at + 8, $length);
        }
    }
    $pixels = gzuncompress($data);
    $row = 1 + $header['width'] * 4;
    // Each row starts with its filter type: none (0) leaves the bytes as they are.
    expect(ord($pixels[$y * $row]))->toBe(0);
    [, $r, $g, $b, $a] = unpack('C4', $pixels, $y * $row + 1 + $x * 4);

    return pixelColour($r, $g, $b, $a);
}

it('gives an iOS home-screen shortcut the mark on a solid 180px square', function () {
    $png = file_get_contents(public_path('apple-touch-icon.png'));

    expect(unpack('Nwidth/Nheight', $png, 16))->toBe(['width' => 180, 'height' => 180])
        ->and(pngPixel($png, 90, 90))->toBe(colourToken('highlight', 'dark'))
        ->and(pngPixel($png, 90, 45))->toBe(colourToken('accent', 'dark'))
        ->and(pngPixel($png, 0, 0))->toBe(colourToken('background', 'dark'))
        ->and(pngPixel($png, 179, 179))->toBe(colourToken('background', 'dark'));
});
