@props(['url'])
{{-- The wordmark: "gtrack" beside the ring-and-dot mark (accent ring, highlight dot), drawn in CSS so it shows with images off. --}}
<tr>
<td class="header">
<a href="{{ $url }}" class="wordmark">
<span class="mark-ring"><span class="mark-dot"></span></span><span class="wordmark-name">{{ $slot }}</span>
</a>
</td>
</tr>
