//
//  Defines.c
//  PiPer
//
//  Created by Adam Marcus on 10/08/2018.
//  Copyright © 2018 Adam Marcus. All rights reserved.
//

#define QUOTE(str) #str
#define EXPAND_AND_QUOTE(str) QUOTE(str)

const char * APP_GROUP_ID = EXPAND_AND_QUOTE(APP_GROUP_ID_CONST);

const char * APP_BUNDLE_ID = EXPAND_AND_QUOTE(APP_BUNDLE_ID_CONST);
const char * EXTENSION_BUNDLE_ID = EXPAND_AND_QUOTE(EXTENSION_BUNDLE_ID_CONST);
