#!/bin/sh
#awk '{ if (/(^.*user:) .*,/) print "    user: 'username',"; else print $0; }'
sed -e "s/^\(.*user:\).*$/\1 '<username>',/g" |
sed -e "s/^\(.*password:\).*$/\1 '<password>',/g" |
sed -e "s/^\(.*serviceId:\).*$/\1 '<service id>',/g" |
sed -e "s/^\(.*authOrgId:\).*$/\1 '<auth org id>',/g"
exit 0
