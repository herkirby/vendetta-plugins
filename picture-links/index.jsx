(function(i){"use strict";const{findByProps:l,findByDisplayName:o}=vendetta.metro,{navigation:u,React:d}=vendetta.metro.common,{after:s}=vendetta.patcher,{getSize:m}=vendetta.metro.common.ReactNative.Image,{Pressable:c}=l("Button","Text","View"),g=o("ProfileBanner",!1),v=o("HeaderAvatar",!1),{openMediaModal:f}=vendetta.metro.findByDisplayName("MediaModal",!1);function p(e,t){u.popAll(),m(e,(n,a)=>f({initialSources:[{uri:e,width:n,height:a}],initialIndex:0,originLayout:{width:0,height:0,x:t.pageX,y:t.pageY,resizeMode:"center"}}))}const y=s("default",v,([{user:e,style:t,guildId:n}],a)=>{const r=e.guildMemberAvatars?.[n]?`https://cdn.discordapp.com/guilds/${n}/users/${e.id}/avatars/${e.guildMemberAvatars[n]}.png`:e?.getAvatarURL?.(!1,4096,!0);if(!r)return a;const M=typeof r=="number"?`https://cdn.discordapp.com/embed/avatars/${e.discriminator%5}.png`:r?.replace(".webp",".png");return delete a.props.style,d.createElement(c,{onPress:({nativeEvent:w})=>p(M,w),style:t},a)}),h=s("default",g,([{bannerSource:e}],t)=>{if(typeof e?.uri!="string"||!t)return t;const n=e.uri.replace(/(?:\?size=\d{3,4})?$/,"?size=4096").replace(".webp",".png");return d.createElement(c,{onPress:({nativeEvent:a})=>p(n,a)},t)});function b(){y(),h()}return i.onUnload=b,i})({});
