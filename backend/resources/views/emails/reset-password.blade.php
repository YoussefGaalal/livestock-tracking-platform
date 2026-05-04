@component('mail::message')
# Password Reset Request

Hello {{ $user->name }},

You recently requested to reset your password for your Oasis Trace account. Click the button below to reset it:

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

If you did not request a password reset, no further action is required.

This password reset link will expire in 24 hours.

Thanks,<br>
The Oasis Trace Team

@component('mail::subcopy')
If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:

[{{ $resetUrl }}]({{ $resetUrl }})
@endcomponent
@endcomponent
