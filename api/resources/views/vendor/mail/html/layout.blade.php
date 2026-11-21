<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<title>{{ config('app.name') }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Instrument+Serif&display=swap">
{{-- The theme CSS is inlined as the light theme. Dark mail clients get the dark tokens from tokens.json here,
     with !important to beat the inlined styles. --}}
<style>
@media only screen and (max-width: 600px) {
.inner-body, .footer { width: 100% !important; }
.content-cell { padding: 28px 22px !important; }
}

@media (prefers-color-scheme: dark) {
body, .wrapper, .content, .body, .header, .footer { background-color: #161616 !important; }
.inner-body { background-color: #262626 !important; }
h1, p, li, td, .wordmark-name { color: #FFFFFF !important; }
.muted, .footer p, .code-note { color: #A3A3A3 !important; }
a { color: #FFFFFF !important; }
.code { background-color: #2E2E2E !important; color: #FFFFFF !important; }
.button-primary { background-color: #EE7B47 !important; border-color: #EE7B47 !important; color: #161616 !important; }
.mark-ring { border-color: #EE7B47 !important; }
.mark-dot { background-color: #B4CB45 !important; }
}
</style>
{!! $head ?? '' !!}
</head>
<body>

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="center">
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
{!! $header ?? '' !!}

<!-- Email Body -->
<tr>
<td class="body" width="100%" cellpadding="0" cellspacing="0" style="border: hidden !important;">
<table class="inner-body" align="center" width="520" cellpadding="0" cellspacing="0" role="presentation">
<!-- Body content -->
<tr>
<td class="content-cell">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</td>
</tr>
</table>
</td>
</tr>

{!! $footer ?? '' !!}
</table>
</td>
</tr>
</table>
</body>
</html>
