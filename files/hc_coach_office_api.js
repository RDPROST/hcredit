////////////////////////////////////////////
////////////////////////////////////////////
//////API v.37 (от 23.09.2021)
////////////////////////////////////////////
////////////////////////////////////////////

// Удаление ресурса базы
/**
 * resource_id - идентификатор ресурса базы
 */
function DeleteResource(resource_id) {
    var eFile = tools.open_doc(resource_id);

    if (eFile != undefined && ArrayOptFirstElem(eFile.TopElem.links) == undefined) {
        try {
            DeleteDoc(UrlFromDocID(eFile.TopElem.id.Value));
        } catch (e) {
            alert("DeleteResource: " + e);
        }
    }

    return true;
}

// Сохранение файла в ресурсы базы
/**
 * user_id - идентификатор пользователя
 * data - файл
 * inf - информация о файле { name: название файла, type: тип файла, size: размер файла }
 */
function SaveFileInResource(user_id, data, inf) {
    obj = { error: 1, message: "", path: "", doc: undefined };

    try {
        sName = inf != undefined ? inf.name : data.FileName;
        docResource = OpenNewDoc('x-local://wtv/wtv_resource.xmd');
        docResource.BindToDb();
        docResource.TopElem.type = UrlPathSuffix(sName); //inf != undefined ? inf.type : 
        docResource.TopElem.person_id = user_id;
        tools.common_filling('collaborator', docResource.TopElem, user_id);

        // time = GetCurTicks();
        docResource.TopElem.put_str(data, UrlFileName(sName));
        // alert(GetCurTicks() - time);

        docResource.Save();

        obj = { error: 0, message: "", path: docResource.DocID, doc: docResource };
    } catch (err) {
        alert("SaveFileInResource: " + err)
    }

    return obj;
}

function getArrFromXML(_str) {
    _f = [];
    if (String(_str) != '') {
        _d = OpenDocFromStr(_str);
        for (_v in _d.rows) {
            _f.push(tools.read_object(tools.object_to_text(_v, "json")));
        }
    }

    return _f;
}

// Определение роли пользователя 
/**
 * user_id      ID пользователя
 */
function GetRoleUser(user_id) {
    sRole = "student";
    iUserID = OptInt(user_id, 0);
    docUser = tools.open_doc(iUserID);

    if (docUser != undefined && docUser.TopElem.access.access_role == 'admin') {
        sRole = "admin";
    } else {
        oGroup = ArrayOptFirstElem(XQuery("sql: \
            SELECT TOP 1 rc.data.value('(//wvars/wvar[name=''group_id'']/value)[1]', 'varchar(50)') group_id \
            FROM \
                remote_collections rcs \
                INNER JOIN remote_collection rc ON rc.id = rcs.id \
            WHERE code = '_settings_homecredit' \
        "));

        if (oGroup != undefined) {
            sQuery = "sql: \
                SELECT TOP 1 \
                    CASE \
                        WHEN EXISTS(SELECT TOP 1 gcs.id FROM group_collaborators gcs WHERE gcs.group_id = " + OptInt(oGroup.group_id, 0) + " AND gcs.collaborator_id = cs.id) THEN 'methodist' \
                        ELSE 'trainer' \
                    END role \
                FROM \
                    collaborators cs \
                WHERE \
                    cs.id = " + iUserID + " \
                    AND ( \
                        EXISTS(SELECT TOP 1 gcs.id FROM group_collaborators gcs WHERE gcs.group_id = " + OptInt(oGroup.group_id, 0) + " AND gcs.collaborator_id = cs.id) \
                        OR EXISTS(SELECT TOP 1 ls.id FROM lectors ls WHERE ls.person_id = cs.id) \
                    ) \
            ";
            oRoleUser = ArrayOptFirstElem(XQuery(sQuery));

            if (oRoleUser != undefined) {
                sRole = String(oRoleUser.role);
            }
        }
    }

    return EncodeJson({
        success: true,
        data: {
            isAdmin: (sRole == 'admin'),
            isMethodist: (sRole == 'methodist'),
            isTrainer: (sRole == 'trainer'),
            isCollaborator: (sRole == 'student'),
        }
    });
}

function Init(collID, teColl) {
    try {
        var docColl = tools.open_doc(collID);
        var teColl = docColl.TopElem;

        return EncodeJson({
            success: true,
            data: {
                userId: docColl.DocID + '',
                fullname: teColl.fullname + '',
                firstname: teColl.firstname + '',
                lastname: teColl.lastname + '',
                org: teColl.position_name + '',
                avatar: String(teColl.pict_url != '' ? teColl.pict_url : '/pics/nophoto.jpg'),
                access: GetRoleUser(collID),
                gender: (teColl.sex == "w" ? "W" : "M")
            }
        })
    }
    catch (e) {
        alert(e);
        throw e;
    }
}

// Список всех активностей (учебных программ с неустановленным признаком "Не актуальная")
/**
 * role                         роль текущего пользователя
 * type [1-мои, 0-другие]       тип обучающей активности
 * search                       строка поиска
 * paging_enable                включен постраничный вывод
 * page_num                     номер текущей страницы
 */
function GetActivities(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
    } catch (e) {
        params = { role: "student" };
    }

    var sRole = String(params.role);
    var iUserID = OptInt(user_id);
    var aResult = [];
    var aActivity = [];
    var aTrainerFiles = [];
    var iCountPage = 5;
    var sQueryD = "";

    try {
        if (params.HasProperty('type')) {
            // sQueryD += OptInt(params.type) == 1 ? " AND rcs.id = " + iUserID + " " : " AND rcs.id <> " + iUserID + " ";
            sQueryD += OptInt(params.type) == 1 ? " AND rcs.id = " + iUserID + " " : "";
        }

        if (params.HasProperty('search')) {
            sQueryD += " AND ems.name LIKE '%" + String(params.search) + "%' ";
        }

        sQuery = "sql: \
            SELECT \
                ems.id, \
                ems.name, \
                ems.state_id, \
                rcs.id person_id, \
                rcs.fullname person_fullname, \
                rc.data.value('(collaborator/firstname)[1]', 'varchar(max)') person_firstname, \
                rc.data.value('(collaborator/lastname)[1]', 'varchar(max)') person_lastname, \
                ISNULL(ems.resource_id, '') resource_id, \
                em.data.value('(education_method/desc)[1]', 'varchar(max)') description, \
                ISNULL(em.data.value('(education_method/custom_elems/custom_elem[name=''duration_min'']/value)[1]', 'varchar(50)'), 0) duration_min, \
                ( \
                    SELECT \
                        CAST(rs.id as VARCHAR(25)) id, \
                        --rs.id, \
                        CASE rs.type WHEN 'img' THEN RIGHT(rs.file_name, 3) ELSE rs.type END type, \
                        '/download_file.html?file_id=' + CAST(rs.id as VARCHAR(25)) url \
                    FROM \
                        em.data.nodes('education_method/files/file') t_f(o) \
                        INNER JOIN resources rs ON rs.id = t_f.o.value('(file_id)[1]','bigint') \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) training_files, \
                --(SELECT string_agg(t_f.o.value('(file_id)[1]','varchar(max)'), ',') [id] FROM em.data.nodes('education_method/files/file') t_f(o)) training_files, \
                em.data.value('(education_method/custom_elems/custom_elem[name=''trainer_files'']/value)[1]', 'varchar(max)') trainer_files, \
                em.data.value('(education_method/custom_elems/custom_elem[name=''links'']/value)[1]', 'varchar(max)') links, \
                CASE WHEN rcs.id = " + iUserID + " THEN '1' ELSE '0' END type, \
                ( \
                    SELECT \
                        COUNT(1) \
                    FROM \
                        education_methods ems \
                        INNER JOIN education_method em ON em.id = ems.id \
                        " + (params.HasProperty('type') ? " INNER JOIN collaborators rcs ON rcs.id = em.data.value('(education_method/custom_elems/custom_elem[name=''responsible'']/value)[1]', 'bigint') " : "") + " \
                    WHERE \
                        ISNULL(em.data.value( '(education_method/custom_elems/custom_elem[name=''not_relevant'']/value)[1]', 'bit'), 0) = 0 \
                        AND em.data.value('(education_method/custom_elems/custom_elem[name=''responsible'']/value)[1]','varchar(1)') IS NOT NULL \
                        " + sQueryD + " \
                ) num \
            FROM \
                education_methods ems \
                INNER JOIN education_method em ON em.id = ems.id \
                INNER JOIN collaborators rcs ON rcs.id = em.data.value('(education_method/custom_elems/custom_elem[name=''responsible'']/value)[1]', 'bigint') \
                INNER JOIN collaborator rc ON rc.id = rcs.id \
            WHERE \
                ISNULL(em.data.value('(education_method/custom_elems/custom_elem[name=''not_relevant'']/value)[1]', 'bit'), 0) = 0 \
                " + sQueryD + " \
            ORDER BY ems.state_id, ems.name \
        ";

        if (tools_web.is_true(params.GetOptProperty('paging_enable', false)) && OptInt(params.GetOptProperty('page_num', 0)) > 0) {
            sQuery += "OFFSET " + (OptInt(params.page_num, 0) * iCountPage) + " ROW FETCH NEXT " + iCountPage + " ROWS ONLY";
        }
        aResult = XQuery(sQuery);

        for (oRes in aResult) {
            aTrainerFiles = [];
            if (sRole != "student" && String(oRes.trainer_files) != "") {
                aTempFiles = XQuery("sql: \
                    SELECT \
                        rs.id, \
                        CASE rs.type WHEN 'img' THEN RIGHT(rs.file_name, 3) ELSE rs.type END type, \
                        '/download_file.html?file_id=' + CAST(rs.id as VARCHAR(25)) url \
                    FROM \
                        resources rs \
                    WHERE rs.id IN(" + oRes.trainer_files + ") \
                ");

                for (oFile in aTempFiles) {
                    aTrainerFiles.push({
                        id: String(oFile.id.Value),
                        type: String(oFile.type),
                        url: String(oFile.url)
                    });
                }
            }

            aActivity.push({
                "id": String(oRes.id),
                "title": String(oRes.name),
                "archive": (oRes.state_id != 'active'),
                "description": String(oRes.description),
                "person_id": String(oRes.person_id),
                "person_fullname": String(oRes.person_fullname),
                "person_firstname": String(oRes.person_firstname),
                "person_lastname": String(oRes.person_lastname),
                "time": OptInt(oRes.duration_min),
                "type": String(oRes.type), // 
                "image": '/download_file.html?file_id=' + String(oRes.resource_id),
                "training_files": getArrFromXML(oRes.training_files.Value),
                "trainer_files": aTrainerFiles,
                "links": (String(oRes.links) != "" ? tools.read_object(oRes.links) : [])
            });
        }

        return EncodeJson({ success: true, error: "", data: aActivity, page_total: String(oRes.num) });
    } catch (e) {
        alert(e);
        return EncodeJson({ success: false, error: e, data: [], page_total: 0 });
    }
}

// Создание/редактирование обучающей активности
/**
 * action create/edit    выбор действия создать/редактировать
 * id                    идентификатор объекта для редактирования, если создание, то поле остается пустым 
 * title                 название учебной программы
 * archive               архивная или нет
 * description           описание
 * person_id             ответственный за программу
 * time                  Длительность активности - время в минутах
 * image                 основное изображение 
 * training_files        Дотренинговые материалы - массив с файлами
 * trainer_files         Материалы для тренера - массив с файлами 
 * links                 массив с ссылками
 * type [1-мои, 0-др]    тип обучающей активности
 */
function SaveEduProgram(user_id, httpRequest) {
    var time = GetCurTicks(); 
    var params = httpRequest.Form;
    var oReturnProgram = {
        "id": "",
        "title": "",
        "archive": 0,
        "description": "",
        "person_id": "",
        "person_fullname": "",
        "person_firstname": "",
        "person_lastname": "",
        "time": "",
        "type": "",
        "image": "",
        "training_files": [],
        "trainer_files": [],
        "links": []
    }

    try {
        var sAction = params.GetOptProperty("request_data[action]");

        if (sAction == "create") {
            eduMethodDoc = OpenNewDoc('x-local://wtv/wtv_education_method.xmd');
            eduMethodDoc.BindToDb(DefaultDb);
        } else {
            eduMethodDoc = tools.open_doc(OptInt(params.GetOptProperty("request_data[data][id]", 0), 0));
        }

        var eduMethodTE = eduMethodDoc.TopElem;
        var iPersonID = OptInt(params.GetOptProperty("request_data[data][person_id]", 0), 0) != 0 ? OptInt(params.GetOptProperty("request_data[data][person_id]", ""), "") : OptInt(user_id);

        var oImage = params.GetOptProperty("request_data[data][image][data]", undefined);
        if (oImage != undefined) {
            oFileInf = {
                type: String(params.GetOptProperty('request_data[data][image][type_real]', "")),
                name: String(params.GetOptProperty('request_data[data][image][name]', "")),
                size: String(params.GetOptProperty('request_data[data][image][size]', ""))
            }

            // alert("time 338 = " + (GetCurTicks() - time));
            // time = GetCurTicks();

            oFileID = SaveFileInResource(user_id, oImage, oFileInf);
            // alert("time 342 = " + (GetCurTicks() - time));
            // time = GetCurTicks();
            
            if (oFileID.error == 0) {
                DeleteResource(eduMethodTE.resource_id);
                eduMethodTE.resource_id = oFileID.path;
            }
        }

        eduMethodTE.name = params.GetOptProperty("request_data[data][title]", "");
        eduMethodTE.state_id = tools_web.is_true(params.GetOptProperty("request_data[data][archive]", "")) ? 'archive' : 'active';
        eduMethodTE.desc = params.GetOptProperty("request_data[data][description]", ""); // нужна доп обертка
        eduMethodTE.custom_elems.ObtainChildByKey('duration_min').value = OptInt(params.GetOptProperty("request_data[data][time]", ""));
        eduMethodTE.custom_elems.ObtainChildByKey('responsible').value = iPersonID;

        try {
            userTE = tools.open_doc(iPersonID).TopElem;
            oReturnProgram.person_id = String(userTE.id);
            oReturnProgram.person_fullname = userTE.fullname;
            oReturnProgram.person_firstname = userTE.firstname;
            oReturnProgram.person_lastname = userTE.lastname;
            tools.common_filling('collaborator', eduMethodTE, iPersonID, userTE);
        } catch (e) {
            alert("SaveEduProgram | ошибка при открытии карточки пользователя с id=" + iPersonID + " - " + e);
        }

        aOldFiles = ArraySelectAll(eduMethodTE.files);
        eduMethodTE.files.Clear();
        if (params.GetOptProperty('request_data[data][training_files][0][type]', null) != null) {
            i = 0;

            while (true) {
                iFileID = OptInt(params.GetOptProperty('request_data[data][training_files][' + i + '][id]', null), 0);
                oFile = params.GetOptProperty('request_data[data][training_files][' + i + '][data]', null);

                if (oFile != null && oFile.FileName.HasValue) {
                    oFileInf = {
                        type: String(params.GetOptProperty('request_data[data][training_files][' + i + '][type_real]', "")),
                        name: String(params.GetOptProperty('request_data[data][training_files][' + i + '][name]', "")),
                        size: String(params.GetOptProperty('request_data[data][training_files][' + i + '][size]', ""))
                    }

                    oFileID = SaveFileInResource(user_id, oFile, oFileInf);

                    if (oFileID.error == 0) {
                        iFileID = oFileID.path;
                    }
                }

                if (iFileID != 0) {
                    oReturnProgram.training_files.push({
                        id: String(iFileID),
                        type: String(params.GetOptProperty('request_data[data][training_files][' + i + '][type]', "")),
                        url: '/download_file.html?file_id=' + String(iFileID)
                    });

                    oNewFile = eduMethodTE.files.AddChild();
                    oNewFile.file_id = iFileID;
                } else {
                    break;
                }

                i++;
            }

            for (oOldFile in aOldFiles) {
                iOldFile = OptInt(oOldFile.file_id.Value, 0);
                oFileFind = ArrayOptFindByKey(eduMethodTE.files, iOldFile, "file_id");

                if (oFileFind == undefined) {
                    DeleteResource(iOldFile);
                }
            }
        }

        // alert("time 423 = " + (GetCurTicks() - time));
        // time = GetCurTicks();

        aObjs = [];
        aOldFiles = [];
        if (params.GetOptProperty('request_data[data][trainer_files][0][type]', null) != null) {
            i = 0;

            while (true) {
                iFileID = OptInt(params.GetOptProperty('request_data[data][trainer_files][' + i + '][id]', null), 0);
                oFile = params.GetOptProperty('request_data[data][trainer_files][' + i + '][data]', null);

                if (oFile != null && oFile.FileName.HasValue) {
                    oFileInf = {
                        type: String(params.GetOptProperty('request_data[data][trainer_files][' + i + '][type_real]', "")),
                        name: String(params.GetOptProperty('request_data[data][trainer_files][' + i + '][name]', "")),
                        size: String(params.GetOptProperty('request_data[data][trainer_files][' + i + '][size]', ""))
                    }

                    oFileID = SaveFileInResource(user_id, oFile, oFileInf);

                    if (oFileID.error == 0) {
                        iFileID = oFileID.path;
                    }
                }

                if (iFileID != 0) {
                    aObjs.push(iFileID);
                    oReturnProgram.trainer_files.push({
                        id: String(iFileID),
                        type: String(params.GetOptProperty('request_data[data][trainer_files][' + i + '][type]', "")),
                        url: '/download_file.html?file_id=' + String(iFileID)
                    });
                } else {
                    break;
                }

                i++;
            }

            sOldFiles = String(eduMethodTE.custom_elems.ObtainChildByKey('trainer_files').value);
            if (sOldFiles != "") {
                aOldFiles = String(eduMethodTE.custom_elems.ObtainChildByKey('trainer_files').value).split(",");

                for (iOldFile in aOldFiles) {
                    if (ArrayOptFind(aObjs, "OptInt(This, 0) == OptInt(iOldFile, 1)") == undefined) {
                        DeleteResource(iOldFile);
                    }
                }
            }
        }
        eduMethodTE.custom_elems.ObtainChildByKey('trainer_files').value = ArrayMerge(aObjs, "This", ",");

        // alert("time 476 = " + (GetCurTicks() - time));
        // time = GetCurTicks();

        aLinks = [];
        if (params.GetOptProperty('request_data[data][links][0][name]', null) != null) {
            i = 0;

            while (true) {
                sName = String(params.GetOptProperty('request_data[data][links][' + i + '][name]', ""));
                sUrl = String(params.GetOptProperty('request_data[data][links][' + i + '][url]', ""));

                if (sName != "" && sUrl != "") {
                    aLinks.push({ name: sName, url: sUrl });
                } else {
                    break;
                }

                i++;
            }
        }
        eduMethodTE.custom_elems.ObtainChildByKey('links').value = tools.object_to_text(aLinks, "json");

        oReturnProgram.id = sAction == "create" ? String(eduMethodDoc.DocID) : String(params.GetOptProperty("request_data[data][id]", 0));
        oReturnProgram.title = eduMethodTE.name;
        oReturnProgram.archive = eduMethodTE.state_id == "archive";
        oReturnProgram.description = eduMethodTE.desc;
        oReturnProgram.time = String(OptInt(params.GetOptProperty("request_data[data][time]", "")));
        oReturnProgram.image = '/download_file.html?file_id=' + String(eduMethodTE.resource_id);
        oReturnProgram.links = aLinks;
        oReturnProgram.type = iPersonID == OptInt(user_id) ? "1" : "0";

        // alert("time 510 = " + (GetCurTicks() - time));
        // time = GetCurTicks();

        eduMethodDoc.Save();

        // alert("time 515 = " + (GetCurTicks() - time));
        // time = GetCurTicks();
    } catch (e) {
        alert(e);
        return EncodeJson({ success: false, error: e, data: [] });
    }

    return EncodeJson({ success: true, error: "", data: [oReturnProgram] });
}

// Сохранение обучающей активности в архив
/**
 * id           ID обучающей активности
 * is_archive   в архив или из архива
 */
function ChangeStateEduProgram(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var eduMethodDoc = tools.open_doc(OptInt(params.id, 0));
        eduMethodDoc.TopElem.state_id = tools_web.is_true(params.is_archive) ? 'archive' : 'active';
        eduMethodDoc.Save();

        var oRes = { "id": String(eduMethodDoc.TopElem.id), "archive": tools_web.is_true(params.is_archive) };

        return EncodeJson({ success: true, error: "", data: [oRes] });
    } catch (e) {
        alert(e);
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Информация об участниках и тренерах мероприятия 
/**
 * event_id              ID мероприятия
 */
function GetInfoPersonsEvent(user_id, httpRequest) {
    var obj = {
        trainers: [],
        persons: []
    }

    try {
        var params = DecodeJson(httpRequest.Body);
    } catch (e) {
        alert(e);
        return obj;
    }

    var iEventID = OptInt(params.event_id, 0);

    if (iEventID != 0) {
        sQuery = "sql: \
            DECLARE @eventID BIGINT = " + iEventID + "; \
            SELECT \
                ( \
                    SELECT \
                        cs.pict_url, \
                        cs.fullname, \
                        c.data.value('(collaborator/desc)[1]', 'varchar(max)') [desc] \
                    FROM \
                        event_lectors els \
                        INNER JOIN lectors ls ON ls.id = els.lector_id \
                        INNER JOIN collaborators cs ON cs.id = ls.person_id \
                        INNER JOIN collaborator c ON c.id = cs.id \
                    WHERE \
                        els.event_id = @eventID \
                        AND ISNULL(cs.is_dismiss, 0) = 0 \
                        AND ISNULL(cs.dismiss_date, '') = '' \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) trainers, \
                ( \
                    SELECT \
                        cs.pict_url, \
                        cs.fullname \
                    FROM \
                        event_results ers \
                        INNER JOIN collaborators cs ON cs.id = ers.person_id \
                    WHERE \
                        ers.event_id = @eventID \
                        AND ers.not_participate = 0 \
                        AND ISNULL(cs.is_dismiss, 0) = 0 \
                        AND ISNULL(cs.dismiss_date, '') = '' \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) persons \
        ";
        var oRes = ArrayOptFirstElem(XQuery(sQuery));

        if (oRes != undefined) {
            obj.trainers = getArrFromXML(oRes.trainers.Value);
            obj.persons = getArrFromXML(oRes.persons.Value);
        }
    }

    return obj;
}

// Удаление сотрудников из мероприятия
/**
 * event_id              ID мероприятия
 */
function DeletePersonFromEvent(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);

        var iUserID = OptInt(params.user_id);
        var iEventID = String(params.event_id);

        tools.del_person_from_event(iUserID, iEventID);

        return EncodeJson({ success: true, error: "", data: [] });
    } catch (e) {
        alert(e);
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Запись текущего пользователя на мероприятие
/**
 * event_id              ID мероприятия
 */
function AddPersonFromEvent(user_id, teUser, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);

        var iUserID = OptInt(user_id);
        var iEventID = OptInt(params.event_id, 0);
        var docEvent = tools.open_doc(iEventID);

        var sQuery = "sql: \
            SELECT \
                TOP 1 \
                es.id \
            FROM \
                events es \
            WHERE \
                es.id = " + iEventID + " \
                AND NOT EXISTS( \
                    SELECT \
                        TOP 1 \
                        es1.id \
                    FROM \
                        events es1 \
                        INNER JOIN event_results ers1 ON ers1.event_id = es1.id AND ers1.person_id = " + iUserID + " \
                    WHERE \
                        es1.id <> es.id \
                        AND es1.education_method_id = es.education_method_id \
                        AND DATEPART(M, es1.start_date) = DATEPART(M, es.start_date) \
                        AND ISNULL(ers1.not_participate, 0) = 0 \
                ) \
        ";
        oCheck = ArrayOptFirstElem(XQuery(sQuery));

        if (oCheck != undefined) {
            oResOld = ArrayOptFirstElem(XQuery("sql: SELECT id FROM event_results ers WHERE ers.event_id = " + iEventID + " AND ers.person_id = " + iUserID));

            if (oResOld != undefined) {
                doc = tools.open_doc(oResOld.id);
                doc.TopElem.not_participate = 0;
                doc.Save();
            } else {
                oRes = docEvent.TopElem.addPerson({
                    'iPersonID': iUserID,
                    'tePerson': teUser,
                    'iEducationPlanID': null,
                    'iRequestPersonID': null,
                    'iRequestID': null,
                    'bDoObtain': false,
                    'bDoFilling': true,
                    'bDoSave': true,
                    'bCreateEventResult': true,
                    'bSendNotification': true
                });

                try {
                    oRes.docEventResult.TopElem.is_assist = false;
                    oRes.docEventResult.Save();
                } catch (e) {
                    alert("AddPersonFromEvent addPerson | " + e)
                }
            }

            return EncodeJson({ success: true, error: "", data: { success: true, error: "" } });
        } else {
            return EncodeJson({ success: true, error: "", data: { success: false, error: "Вы записаны на другое мероприятие по данной обучающей активности в том же месяце" } });
        }
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: {} });
    }
}

// Отписка текущего пользователя от мероприятия, отказ от участия
/**
 * event_id              ID мероприятия
 * comment               Причина
 */
function NotParticipatePersonFromEvent(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);

        var iUserID = OptInt(user_id);
        var iEventID = OptInt(params.event_id, 0);
        var sComment = String(params.comment);

        var sQuery = "sql: SELECT TOP 1 id FROM event_results WHERE event_id = " + iEventID + " AND person_id = " + iUserID;
        var oEventResult = ArrayOptFirstElem(XQuery(sQuery));

        var docEventResult = tools.open_doc(oEventResult.id);
        docEventResult.TopElem.is_assist = 0;
        docEventResult.TopElem.not_participate = 1;
        docEventResult.TopElem.comment = sComment;
        docEventResult.Save();
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Создание мероприятия
/**
 * action                сохранить/редактировать (save|edit)
 * id                    ID мероприятия
 * activity_id           ID обучающей активности
 * date                  дата начала 
 * time                  время начала
 * places                максимальное количество участников
 * link                  ссылка 
 * collaborators         сотрудники, записанные на мероприятие
 *      firstname
 *      lastname
 *      avatar
 *      gender
 *      marked
 * lectors               список тренеров
 *      firstname
 *      lastname
 *      avatar
 *      id
 *      gender
 *      position_name
 */

function CreateAppointEvent(user_id, httpRequest) {
    var params = httpRequest.Form;
    var oReturnEvent = {
        "id": "",
        "activity_id": "",
        "date": "",
        "time": "",
        "places": "",
        "link": "",
        "collaborators": [],
        "lectors": []
    }

    try {
        if (params.GetOptProperty("request_data[action]", "") == "edit") {
            eventDoc = tools.open_doc(params.GetOptProperty("request_data[id]", 0));
        } else {
            eventDoc = OpenNewDoc('x-local://wtv/wtv_event.xmd');
            eventDoc.BindToDb(DefaultDb);
        }

        eventTE = eventDoc.TopElem;
        eventTE.type_id = 'education_method';
        eventTE.event_type_id = 5787283383659285608;
        eventTE.status_id = 'plan';
        eventTE.education_method_id = OptInt(params.GetOptProperty("request_data[activity_id]", ""), "");
        eventTE.custom_elems.ObtainChildByKey('link').value = params.GetOptProperty("request_data[link]", "");

        try {
            docTE = tools.open_doc(eventTE.education_method_id).TopElem;
            tools.common_filling('education_method', eventTE, eventTE.education_method_id, docTE);
            eventTE.name = docTE.name;
        } catch (e) {
            alert("CreateAppointEvent education_method | " + e);
        }

        if (OptDate(params.GetOptProperty("request_data[date]", "")) != undefined) {
            eventTE.start_date = params.GetOptProperty("request_data[time]", "") != "" ? OptDate(params.GetOptProperty("request_data[date]", "") + "T" + params.GetOptProperty("request_data[time]", "")) : OptDate(params.GetOptProperty("request_data[date]", ""));

            oReturnEvent.date = OptDate(params.GetOptProperty("request_data[date]", ""));
            oReturnEvent.time = params.GetOptProperty("request_data[time]", "");
        }

        eventTE.lectors.Clear();
        if (params.GetOptProperty('request_data[lectors][0][id]', null) != null) {
            i = 0;

            while (true) {
                iLectorID = OptInt(params.GetOptProperty('request_data[lectors][' + i + '][id]', null), 0);

                if (iLectorID != 0) {
                    oLector = ArrayOptFirstElem(XQuery("sql: \
                        SELECT \
                            TOP 1 \
                            id, \
                            person_id \
                        FROM \
                            lectors \
                        WHERE \
                            person_id = " + iLectorID + " OR id = " + iLectorID
                    ));

                    if (oLector != undefined) {
                        try {
                            if (ArrayOptFirstElem(eventTE.tutors) == undefined) {
                                _coll_add = eventTE.tutors.AddChild();
                                _coll_add.collaborator_id = OptInt(oLector.person_id);
                                tools.common_filling('collaborator', _coll_add, _coll_add.collaborator_id)
                            }

                            if (ArrayOptFind(eventTE.lectors, "OptInt(This.lector_id) == " + OptInt(oLector.person_id)) == undefined) {
                                _coll_add = eventTE.lectors.AddChild();
                                _coll_add.lector_id = OptInt(oLector.id);
                            }
                        } catch (e) {
                            alert("CreateAppointEvent collaborator | " + e);
                        }

                        oReturnEvent.lectors.push({
                            id: String(oLector.person_id),
                            firstname: params.GetOptProperty('request_data[collaborators][' + i + '][firstname]', ""),
                            lastname: params.GetOptProperty('request_data[collaborators][' + i + '][lastname]', ""),
                            avatar: params.GetOptProperty('request_data[collaborators][' + i + '][avatar]', ""),
                            gender: params.GetOptProperty('request_data[collaborators][' + i + '][gender]', ""),
                            position_name: params.GetOptProperty('request_data[collaborators][' + i + '][position_name]', "")
                        });
                    }

                    i++;
                } else {
                    break;
                }
            }
        }

        eventDoc.Save();

        eventTE.max_person_num = String(OptInt(params.GetOptProperty('request_data[places]', ""), ""));

        i = 0;
        aCurCollaboratorEvent = ArraySort(XQuery("sql: SELECT person_id id FROM event_results WHERE not_participate = 0 AND event_id = " + eventDoc.DocID), "id", "+");
        aNewListCollaboratorEvent = [];

        while (true) {
            if (OptInt(params.GetOptProperty('request_data[collaborators][' + i + '][id]', null), 0) != 0) {
                aNewListCollaboratorEvent.push({
                    id: String(params.GetOptProperty('request_data[collaborators][' + i + '][id]', null)),
                    firstname: String(params.GetOptProperty('request_data[collaborators][' + i + '][firstname]', "")),
                    lastname: String(params.GetOptProperty('request_data[collaborators][' + i + '][lastname]', "")),
                    avatar: String(params.GetOptProperty('request_data[collaborators][' + i + '][avatar]', "")),
                    gender: String(params.GetOptProperty('request_data[collaborators][' + i + '][gender]', "")),
                    marked: false
                });

                i++;
            } else {
                break;
            }
        }

        aNewListCollaboratorEvent = ArraySort(aNewListCollaboratorEvent, "id", "+");

        for (oCurCollaborator in aCurCollaboratorEvent) {
            if (ArrayOptFindBySortedKey(aNewListCollaboratorEvent, String(oCurCollaborator.id), "id") == undefined) {
                eventDoc.TopElem.collaborators.DeleteChildren("OptInt(This.collaborator_id) == " + OptInt(oCurCollaborator.id, 0));
                tools.del_person_from_event(OptInt(oCurCollaborator.id, 0), eventDoc.DocID);
            }
        }

        for (oNewListCollaboratorEvent in aNewListCollaboratorEvent) {
            if (ArrayOptFindBySortedKey(aCurCollaboratorEvent, OptInt(oNewListCollaboratorEvent.id, 0), "id") == undefined) {
                oRes = eventDoc.TopElem.addPerson({
                    'iPersonID': OptInt(oNewListCollaboratorEvent.id, 0),
                    'tePerson': null,
                    'iEducationPlanID': null,
                    'iRequestPersonID': null,
                    'iRequestID': null,
                    'bDoObtain': false,
                    'bDoFilling': true,
                    'bDoSave': true,
                    'bCreateEventResult': true,
                    'bSendNotification': true
                });

                try {
                    oRes.docEventResult.TopElem.is_assist = false
                    oRes.docEventResult.Save();
                } catch (e) {
                    alert("CreateAppointEvent oNewListCollaboratorEvent | Сотрудник с ID = " + OptInt(oNewListCollaboratorEvent.id, 0) + " отказался от участия в мероприятии")
                }
            }
        }

        oReturnEvent.id = String(eventDoc.DocID);
        oReturnEvent.activity_id = eventTE.education_method_id;
        oReturnEvent.places = eventTE.max_person_num;
        oReturnEvent.link = params.GetOptProperty("request_data[link]", "");
        oReturnEvent.collaborators = aNewListCollaboratorEvent;

        eventDoc.Save();

        return EncodeJson({ success: true, error: "", data: oReturnEvent });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: oReturnEvent });
    }
}

// Получение списка сотрудников из файла excel
/**
 * file                  загрузка сотрудников из excel (object)
 *      type                тип загруженного файла
 *      name                название
 *      data                файл
 *      size                размер
 */

function loadXls(path2file, titleRow, startDataRow, limitRow) {

    function getLetter(countColl) {
        countColl = OptInt(countColl, 1);
        var aStr = [];
        var f = 0;
        while (true) {
            f = countColl / 26;
            if (f > 0) countColl = countColl - (f * 26);
            aStr.push(countColl);
            countColl = f;
            if (f == 0) break;
        }

        var _aStr = [];
        var i = 0;
        for (i = ArrayCount(aStr) - 1; i >= 0; i--) {
            _aStr.push(String.fromCharCode(aStr[i] + 64));
        }
        return _aStr.join('');
    }

    function getValue(coll, row, oWorksheet) {
        var value = '';
        oCell = oWorksheet.Cells.GetCell(coll + row);
        value = oCell.Value;
        return value == undefined ? '' : Trim(value);
    }

    limitRow = startDataRow + limitRow;

    var aXls = [];
    var oExcelDoc = new ActiveXObject("Websoft.Office.Excel.Document");
    oExcelDoc.Open(path2file);
    var oWorksheet = oExcelDoc.GetWorksheet(0);
    var iCountTitle = 0;
    var iCountCleanColl = 0;
    var j = 1;

    while (true) {
        _v = getValue(getLetter(j), titleRow, oWorksheet);
        if (_v == '') break;
        iCountTitle++;
        j++;
    }

    while (true) {
        _obj = new Object();
        for (j = 1; j <= iCountTitle; j++) {
            _v = getValue(getLetter(j), startDataRow, oWorksheet)
            _obj.SetProperty(String(j), _v);
            if (_v == '') iCountCleanColl++
        }

        if (iCountCleanColl == iCountTitle) break;
        aXls.push(_obj);
        if (startDataRow >= limitRow) break;
        startDataRow++
    }

    return aXls;
}

function getFileResource(IDResource) {
    var oRes = {
        error: 0,
        message: '',
        url: '',
    };

    if (OptInt(IDResource, 0) == 0) {
        oRes.message = 'Файл не выбран';
        oRes.error = 1;
    } else {
        var docFile = tools.open_doc(OptInt(IDResource, 0));
        if (docFile == undefined) {
            oRes.error = 1;
            oRes.message = "Файл не найден";
        } else {
            var _url = ObtainSessionTempFile('.xlsx');
            docFile.TopElem.get_data(_url);
            oRes.url = UrlToFilePath(_url);
        }
    }
    return oRes;
}

function AddPersonToEventFromExcel(user_id, httpRequest) {
    var params = httpRequest.Form;
    var aCollaborators = [];

    try {
        oFile = params.GetOptProperty('request_data[file][data]', null);

        if (oFile != null && oFile.FileName.HasValue) {
            oFileInf = {
                type: String(params.GetOptProperty('request_data[file][type]', "")),
                name: String(params.GetOptProperty('request_data[file][name]', ""))
            }
            oFileID = SaveFileInResource(user_id, oFile, oFileInf);

            if (oFileID.error == 0) {
                iFileID = oFileID.path;
                docResource = oFileID.doc;
                teResource = docResource.TopElem;
                excelFileUrl = teResource.file_url;
                aRows = [];

                var o = getFileResource(iFileID);
                if (o.error == 1) {
                    return EncodeJson({ success: false, error: o.message, data: [] });
                }

                var aData = loadXls(o.url, 1, 2, 1000);

                for (oRow in aData) {
                    sCode = String(Trim(oRow.GetOptProperty('1')));
                    sFullname = String(Trim(oRow.GetOptProperty('2')));

                    if (sCode != "" && sFullname != "") {
                        oCollaborator = ArrayOptFirstElem(XQuery("sql: \
                            SELECT TOP 1 \
                                cs.id, \
                                cs.fullname, \
                                c.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                                c.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                                cs.email, \
                                cs.sex, \
                                cs.pict_url \
                            FROM \
                                collaborators cs \
                                INNER JOIN collaborator c ON c.id = cs.id \
                            WHERE \
                                cs.code = '" + sCode + "' AND cs.fullname = '" + sFullname + "' \
                        "));

                        if (oCollaborator != undefined) {
                            aCollaborators.push({
                                id: String(oCollaborator.id),
                                fullname: String(oCollaborator.fullname),
                                firstname: String(oCollaborator.firstname),
                                lastname: String(oCollaborator.lastname),
                                email: String(oCollaborator.email),
                                url: String(oCollaborator.pict_url),
                                gender: String(oCollaborator.sex)
                            });
                        }
                    }
                }

                DeleteResource(iFileID);
            }
        }

        return EncodeJson({ success: true, error: "", data: aCollaborators });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// получение списка активностей (id, title) и ссылку на образец "sample"
/**
 * 
 */
function GetInfoForCreateEvent(user_id, httpRequest) {
    try {
        var aResult = [];
        var aActivites = [];

        sQuery = "sql: \
            SELECT \
                ems.id, \
                ems.code, \
                ems.name title \
            FROM \
                education_methods ems \
                INNER JOIN education_method em ON em.id = ems.id \
            WHERE \
                ems.state_id = 'active' \
                AND ISNULL(em.data.value('(education_method/custom_elems/custom_elem[name=''not_relevant'']/value)[1]', 'bit'), 0) = 0 \
            ORDER BY ems.name \
        ";
        aResult = XQuery(sQuery);

        for (elem in aResult) {
            aActivites.push({
                id: String(elem.id),
                code: String(elem.code),
                title: String(elem.title)
            })
        }

        oFileSample = ArrayOptFirstElem(XQuery("sql: \
            SELECT TOP 1 rc.data.value('(//wvars/wvar[name=''sample_import_excel_file'']/value)[1]', 'varchar(max)') file_id \
            FROM \
                remote_collections rcs \
                INNER JOIN remote_collection rc ON rc.id = rcs.id \
            WHERE code = '_settings_homecredit' \
        "));

        iFileID = oFileSample != undefined ? oFileSample.file_id : 0;

        doc = tools.open_doc(iFileID);
        if (doc == undefined) {
            sUrl = "";
        } else {
            sUrl = "/download_file.html?file_id=" + String(iFileID);
        }

        return EncodeJson({ success: true, error: "", data: aActivites, sample_id: sUrl });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [], sample_id: "0" });
    }
}

// поиск по тренерам по ФИО
/**
 * search       ключевая фраза для поиска сотрудника по ФИО
 */
function GetLectorsForCreateEvent(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var aResult = [];
        var aLectors = [];

        if (String(params.search) != "") {
            oOrgID = ArrayOptFirstElem(XQuery("sql: \
                SELECT TOP 1 rc.data.value('(//wvars/wvar[name=''org_id'']/value)[1]', 'varchar(max)') org_id \
                FROM \
                    remote_collections rcs \
                    INNER JOIN remote_collection rc ON rc.id = rcs.id \
                WHERE code = '_settings_homecredit' \
            "));

            iOrgID = oOrgID != undefined ? OptInt(oOrgID.org_id, 0) : 0;

            doc = tools.open_doc(iOrgID);
            sSearch = doc == undefined ? "" : " AND cs.org_id = " + iOrgID;

            sQuery = "sql: \
                SELECT \
                    cs.id, \
                    cs.code, \
                    cs.fullname, \
                    c.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                    c.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                    c.data.value('(collaborator/desc)[1]', 'varchar(max)') [desc], \
                    cs.email, \
                    cs.position_name, \
                    cs.sex, \
                    cs.pict_url \
                FROM \
                    lectors ls \
                    INNER JOIN collaborators cs ON cs.id = ls.person_id \
                    INNER JOIN collaborator c ON c.id = cs.id \
                WHERE \
                    ISNULL(cs.is_dismiss, 0) = 0 \
                    AND ISNULL(cs.dismiss_date, '') = '' \
                    AND cs.fullname LIKE '%" + String(params.search) + "%' \
                    " + sSearch + " \
                ORDER BY cs.fullname \
            ";
            aResult = XQuery(sQuery);

            for (elem in aResult) {
                aLectors.push({
                    id: String(elem.id),
                    code: String(elem.code),
                    fullname: String(elem.fullname),
                    firstname: String(elem.firstname),
                    lastname: String(elem.lastname),
                    position_name: String(elem.position_name),
                    email: String(elem.email),
                    url: String(elem.pict_url),
                    gender: String(elem.sex),
                    desc: String(elem.desc)
                })
            }
        }

        return EncodeJson({ success: true, error: "", data: aLectors });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// поиск по сотрудникам по ФИО и email
/**
 * search       ключевая фраза для поиска сотрудника по ФИО и email
 */
function GetCollaboratorsForCreateEvent(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var aResult = [];
        var aCollaborators = [];

        if (String(params.search) != "") {
            oOrgID = ArrayOptFirstElem(XQuery("sql: \
                SELECT TOP 1 rc.data.value('(//wvars/wvar[name=''org_id'']/value)[1]', 'varchar(max)') org_id \
                FROM \
                    remote_collections rcs \
                    INNER JOIN remote_collection rc ON rc.id = rcs.id \
                WHERE code = '_settings_homecredit' \
            "));

            iOrgID = oOrgID != undefined ? OptInt(oOrgID.org_id, 0) : 0;

            doc = tools.open_doc(iOrgID);
            sSearch = doc == undefined ? "" : " AND cs.org_id = " + iOrgID;

            sQuery = "sql: \
                SELECT \
                    cs.id, \
                    cs.code, \
                    cs.fullname, \
                    c.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                    c.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                    cs.email, \
                    cs.sex, \
                    cs.pict_url \
                FROM \
                    collaborators cs \
                    INNER JOIN collaborator c ON c.id = cs.id \
                WHERE \
                    ISNULL(cs.is_dismiss, 0) = 0 \
                    AND ISNULL(cs.dismiss_date, '') = '' \
                    AND (cs.fullname LIKE '%" + String(params.search) + "%' OR cs.email LIKE '%" + String(params.search) + "%') \
                    " + sSearch + " \
                ORDER BY cs.fullname \
            ";
            aResult = XQuery(sQuery);

            for (elem in aResult) {
                aCollaborators.push({
                    id: String(elem.id),
                    code: String(elem.code),
                    fullname: String(elem.fullname),
                    firstname: String(elem.firstname),
                    lastname: String(elem.lastname),
                    email: String(elem.email),
                    url: String(elem.pict_url),
                    gender: String(elem.sex)
                })
            }
        }

        return EncodeJson({ success: true, error: "", data: aCollaborators });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// информация по сотруднику
/**
 * search       ключевая фраза для поиска сотрудника по ФИО
 */
function GetCollaboratorByID(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var oRes = undefined;

        if (String(params.search) != "") {
            sQuery = "sql: \
                SELECT \
                    TOP 1 \
                    cs.id, \
                    cs.code, \
                    cs.fullname, \
                    cs.email, \
                    cs.position_name, \
                    cs.pict_url \
                FROM \
                    collaborators cs \
                WHERE \
                    cs.id = " + String(params.person_id) + " \
                    AND ISNULL(cs.is_dismiss, 0) = 0 \
                    AND ISNULL(cs.dismiss_date, '') = '' \
            ";
            oRes = ArrayOptFirstElem(XQuery(sQuery));

            if (oRes == undefined) {
                return EncodeJson({ success: false, error: "Сотрудник с id = " + String(params.person_id) + " не найден", data: undefined });
            }
        }

        return EncodeJson({ success: true, error: "", data: oRes });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: undefined });
    }
}

// список сотрудников, которые могут быть отвественными из группы "Методологи"
/**
 * search       ключевая фраза для поиска сотрудника по ФИО
 */
function GetCollaboratorsForSaveEduProgram(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var aCollaborators = [];

        oGroup = ArrayOptFirstElem(XQuery("sql: \
            SELECT TOP 1 rc.data.value('(//wvars/wvar[name=''group_id'']/value)[1]', 'bigint') group_id \
            FROM \
                remote_collections rcs \
                INNER JOIN remote_collection rc ON rc.id = rcs.id \
                -- INNER JOIN groups gs ON gs.id = rc.data.value('(//wvars/wvar[name=''group_id'']/value)[1]', 'bigint') \
            WHERE code = '_settings_homecredit' \
        "));

        // if (String(params.search) != "") {
        sQuery = "sql: \
            SELECT \
                cs.id, \
                cs.code, \
                cs.fullname, \
                c.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                c.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                cs.sex \
            FROM \
                collaborators cs \
                INNER JOIN collaborator c ON c.id = cs.id \
                " + (oGroup != undefined ? " INNER JOIN group_collaborators gcs ON gcs.group_id = " + OptInt(oGroup.group_id, 0) + " AND gcs.collaborator_id = cs.id" : "") + " \
            WHERE \
                ISNULL(cs.is_dismiss, 0) = 0 \
                AND ISNULL(cs.dismiss_date, '') = '' \
                " + (String(params.search) != "" ? " AND cs.fullname LIKE '%" + String(params.search) + "%'" : "") + " \
        ";
        aResult = XQuery(sQuery);

        for (elem in aResult) {
            aCollaborators.push({
                id: String(elem.id),
                code: String(elem.code),
                fullname: String(elem.fullname),
                firstname: String(elem.firstname),
                lastname: String(elem.lastname),
                gender: String(elem.sex)
            })
        }
        // }

        return EncodeJson({ success: true, error: "", data: aCollaborators });
    } catch (e) {
        alert(e);
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Список мероприятий для страницы Расписание
// pagination
/**
 * id                       ID мероприятия
 * activity_id              ID обучающей активности (учебной программы)
 * title                    название из УП
 * image                    url изображения из УП
 * description              описание активности из УП
 * start_time               время начала
 * start_date               дата начала
 * end_date                 дата окончания
 * time                     длительность в сек
 * state_id                 статус мероприятия (название)
 * trainer                  тренера
 *      firstname
 *      lastname
 *      fullname
 *      avatar
 *      id
 *      gender
 *      position_name
 * training_files           из УП
 *      name
 *      type
 *      url
 * trainer_files            из УП
 *      name
 *      type
 *      url
 * links                    ссылки из УП
 *      name
 *      url
 * collaborators            сотрудники, записанные на мероприятие
 *      firstname
 *      lastname
 *      avatar
 *      gender
 *      marked
 * qrcode_link              ссылка для формирования qr-кода
 */
function GetListEvents(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var aEvents = [];
        var sCoachIDs = "";
        var sSearch = "";
        var sStatus = "";
        var iPage = 0;
        var dStart = Date(StrDate(Date(), false, false));
        var dEnd = "";
        var dStartS = "";
        var dEndS = "";
        var dStartF = "";
        var dEndF = "";

        if (params.GetOptProperty("filters") != undefined) {
            sCoachIDs = params.filters.coachId != "" ? ArrayMerge(params.filters.coachId, "OptInt(This)", ",") : "";
            sSearch = String(params.filters.GetOptProperty("search", ""));
            sStatus = String(params.filters.status) != "" ? "'" + ArrayMerge(String(params.filters.status).split(','), "This", "','") + "' " : "";
            iPage = OptInt(params.filters.GetOptProperty("pages", 0), 0);

            try {
                // dStart = params.filters.startDate != "" ? Date(StrDate(Date(params.filters.startDate), false, false)) : dStart;
                // dEnd = params.filters.endDate != "" ? Date(StrDate(Date(params.filters.endDate), false, false)) : "";
                dStartF = params.filters.startDate != "" ? Date(StrDate(Date(params.filters.startDate), false, false)) : "";
                dEndF = params.filters.endDate != "" ? Date(StrDate(Date(params.filters.endDate), false, false)) : "";
            } catch (e) {
                alert("GetListEvents filters | " + e)
            }
        }

        if (sCoachIDs == "" && sSearch == "" && sStatus == "" && params.filters.startDate == "" && params.filters.endDate == "") {
            dStartS = DateOffset(dStart, iPage * 5 * 86400);
            dEndS = DateOffset(dStartS, 5 * 86400);

            if (dEnd != "" && dEndS > dEnd) {
                dEndS = dEnd;
            }

            // alert("iPage = " + iPage)
            // alert("dStartS = " + dStartS)
            // alert("dEndS = " + dEndS)
        }

        // if(dStartS == dEndS && iPage > 0){
        //     aResult = [];
        // }else{
        sQuery = "sql: \
                SELECT \
                    es.id, \
                    es.education_method_id activity_id, \
                    ems.name title, \
                    ISNULL(ems.resource_id, '') image, \
                    em.data.value('(education_method/desc)[1]', 'varchar(max)') description, \
                    FORMAT( es.start_date, 'HH:mm', 'en-US' ) start_time, \
                    FORMAT( es.start_date, 'yyyy.MM.dd', 'en-US' ) start_date, \
                    FORMAT( es.finish_date, 'dd.MM.yyyy', 'en-US' ) end_date, \
                    ISNULL(em.data.value('(education_method/custom_elems/custom_elem[name=''duration_min'']/value)[1]', 'varchar(50)'), 0) time, \
                    es.status_id state_id, \
                    CASE es.status_id \
                        WHEN 'active' THEN 'В процессе' \
                        WHEN 'cancel' THEN 'Отменено' \
                        WHEN 'close' THEN 'Завершено' \
                        ELSE 'Ожидается' \
                    END status, \
                    ( \
                        SELECT \
                            CAST(cs1.id AS VARCHAR(MAX)) id, \
                            c1.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                            c1.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                            cs1.fullname fullname, \
                            cs1.pict_url avatar, \
                            cs1.sex gender, \
                            cs1.position_name position_name, \
                            c1.data.value('(collaborator/desc)[1]', 'varchar(max)') [desc] \
                        FROM \
                            event_lectors els \
                            INNER JOIN collaborators cs1 ON cs1.id = els.person_id \
                            INNER JOIN collaborator c1 ON c1.id = cs1.id \
                        WHERE \
                            els.event_id = es.id \
                            AND ISNULL(cs1.is_dismiss, 0) = 0 \
                            AND ISNULL(cs1.dismiss_date, '') = '' \
                        FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                    ) [trainer], \
                    ( \
                        SELECT \
                            CAST(rs.id as VARCHAR(25)) id, \
                            CASE rs.type WHEN 'img' THEN RIGHT(rs.file_name, 3) ELSE rs.type END type, \
                            '/download_file.html?file_id=' + CAST(rs.id as VARCHAR(25)) url \
                        FROM \
                            em.data.nodes('education_method/files/file') t_f(o) \
                            INNER JOIN resources rs ON rs.id = t_f.o.value('(file_id)[1]','bigint') \
                        FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                    ) training_files, \
                    em.data.value('(education_method/custom_elems/custom_elem[name=''trainer_files'']/value)[1]', 'varchar(max)') trainer_files, \
                    em.data.value('(education_method/custom_elems/custom_elem[name=''links'']/value)[1]', 'varchar(max)') links, \
                    ( \
                        SELECT \
                            CAST(c1.id AS VARCHAR(MAX)) id, \
                            c1.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                            c1.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                            cs1.pict_url avatar, \
                            cs1.sex gender, \
                            --CASE ers1.is_assist WHEN 1 THEN 'true' ELSE 'false' END marked \
                            ers1.is_assist marked \
                        FROM \
                            event_results ers1 \
                            INNER JOIN collaborators cs1 ON cs1.id = ers1.person_id \
                            INNER JOIN collaborator c1 ON c1.id = cs1.id \
                        WHERE \
                            ers1.event_id = es.id \
                            AND ers1.not_participate = 0 \
                            AND ISNULL(cs1.is_dismiss, 0) = 0 \
                            AND ISNULL(cs1.dismiss_date, '') = '' \
                        FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                    ) [collaborators], \
                    ISNULL(e.data.value('(event/max_person_num)[1]', 'int'), 0) max_person_num, \
                    e.data.value('(event/custom_elems/custom_elem[name=''link'']/value)[1]', 'varchar(max)') qrcode_link \
                FROM \
                    events es \
                    INNER JOIN education_methods ems ON ems.id = es.education_method_id \
                    INNER JOIN education_method em ON em.id = ems.id \
                    INNER JOIN event e ON e.id = es.id \
                WHERE \
                    es.type_id = 'education_method' \
                    " + (
                dStartS != "" && dEndS != "" ? (
                    dStartS == dEndS
                        ? " AND CONVERT(DATE, es.start_date, 104) = CONVERT(DATE, '" + dStartS + "', 104) "
                        : " \
                                AND CONVERT(DATE, es.start_date, 104) >= CONVERT(DATE, '" + dStartS + "', 104) \
                                AND CONVERT(DATE, es.start_date, 104) < CONVERT(DATE, '" + dEndS + "', 104) \
                            "
                ) : ""
            ) + " \
                    \
                    " + (dStartF != "" ? " AND CONVERT(DATE, es.start_date, 104) >= CONVERT(DATE, '" + dStartF + "', 104) " : "") + " \
                    " + (dEndF != "" ? " AND CONVERT(DATE, es.start_date, 104) <= CONVERT(DATE, '" + dEndF + "', 104) " : "") + " \
                    \
                    " + (sStatus != "" ? " AND es.status_id IN(" + sStatus + ") " : "") + " \
                    " + (sSearch != "" ? " AND es.name LIKE '%" + sSearch + "%' " : "") + " \
                    " + (sCoachIDs != "" ? " AND EXISTS( \
                        SELECT TOP 1 els.id FROM event_lectors els WHERE els.event_id = es.id AND els.person_id IN(" + sCoachIDs + ") \
                    ) " : "") + " \
            ";
        // alert(sQuery);
        aResult = XQuery(sQuery);
        // }

        for (oRes in aResult) {
            aTrainerFiles = [];
            if (String(oRes.trainer_files) != "") {
                aTempFiles = XQuery("sql: \
                    SELECT \
                        rs.id, \
                        CASE rs.type WHEN 'img' THEN RIGHT(rs.file_name, 3) ELSE rs.type END type, \
                        '/download_file.html?file_id=' + CAST(rs.id as VARCHAR(25)) url \
                    FROM \
                        resources rs \
                    WHERE rs.id IN(" + oRes.trainer_files + ") \
                ");

                for (oFile in aTempFiles) {
                    aTrainerFiles.push({
                        id: String(oFile.id.Value),
                        type: String(oFile.type),
                        url: String(oFile.url)
                    });
                }
            }

            aEvents.push({
                "id": String(oRes.id.Value),
                "title": String(oRes.title),
                "activity_id": String(oRes.activity_id),
                "places": String(oRes.max_person_num),
                "image": '/download_file.html?file_id=' + String(oRes.image),
                "description": String(oRes.description),
                "start_time": String(oRes.start_time),
                "start_date": String(oRes.start_date),
                "end_date": String(oRes.end_date),
                "time": String(oRes.time),
                "status": String(oRes.status),
                "state_id": String(oRes.state_id),
                "trainer": getArrFromXML(oRes.trainer.Value),
                "training_files": getArrFromXML(oRes.training_files.Value),
                "trainer_files": aTrainerFiles,
                "links": (String(oRes.links) != "" ? tools.read_object(oRes.links) : []),
                "collaborators": getArrFromXML(oRes.collaborators.Value),
                "qrcode_link": String(oRes.qrcode_link)
            });
        }

        return EncodeJson({ success: true, error: "", data: aEvents });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

function GetEventByID(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var iEventID = OptInt(params.GetOptProperty("id"), 0);

        sQuery = "sql: \
            SELECT \
                TOP 1 \
                es.id, \
                es.education_method_id activity_id, \
                ems.name title, \
                ISNULL(ems.resource_id, '') image, \
                em.data.value('(education_method/desc)[1]', 'varchar(max)') description, \
                FORMAT( es.start_date, 'HH:mm', 'en-US' ) start_time, \
                FORMAT( es.start_date, 'yyyy.MM.dd', 'en-US' ) start_date, \
                FORMAT( es.finish_date, 'dd.MM.yyyy', 'en-US' ) end_date, \
                ISNULL(em.data.value('(education_method/custom_elems/custom_elem[name=''duration_min'']/value)[1]', 'varchar(50)'), 0) time, \
                es.status_id state_id, \
                CASE es.status_id \
                    WHEN 'active' THEN 'В процессе' \
                    WHEN 'cancel' THEN 'Отменено' \
                    WHEN 'close' THEN 'Завершено' \
                    ELSE 'Ожидается' \
                END status, \
                ( \
                    SELECT \
                        CAST(cs1.id AS VARCHAR(MAX)) id, \
                        c1.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                        c1.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                        c1.data.value('(collaborator/desc)[1]', 'varchar(max)') [desc], \
                        -- l.data.value('(lector/desc)[1]', 'varchar(max)') [desc], \
                        cs1.fullname fullname, \
                        cs1.pict_url avatar, \
                        cs1.sex gender, \
                        cs1.position_name position_name \
                    FROM \
                        event_lectors els \
                        INNER JOIN collaborators cs1 ON cs1.id = els.person_id \
                        INNER JOIN collaborator c1 ON c1.id = cs1.id \
                        INNER JOIN lector l ON l.id = els.lector_id \
                    WHERE \
                        els.event_id = es.id \
                        AND ISNULL(cs1.is_dismiss, 0) = 0 \
                        AND ISNULL(cs1.dismiss_date, '') = '' \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) [trainer], \
                ( \
                    SELECT \
                        CAST(rs.id as VARCHAR(25)) id, \
                        CASE rs.type WHEN 'img' THEN RIGHT(rs.file_name, 3) ELSE rs.type END type, \
                        '/download_file.html?file_id=' + CAST(rs.id as VARCHAR(25)) url \
                    FROM \
                        em.data.nodes('education_method/files/file') t_f(o) \
                        INNER JOIN resources rs ON rs.id = t_f.o.value('(file_id)[1]','bigint') \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) training_files, \
                em.data.value('(education_method/custom_elems/custom_elem[name=''trainer_files'']/value)[1]', 'varchar(max)') trainer_files, \
                em.data.value('(education_method/custom_elems/custom_elem[name=''links'']/value)[1]', 'varchar(max)') links, \
                ( \
                    SELECT \
                        CAST(c1.id AS VARCHAR(MAX)) id, \
                        c1.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                        c1.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                        cs1.pict_url avatar, \
                        cs1.sex gender, \
                        --CASE ers1.is_assist WHEN 1 THEN 'true' ELSE 'false' END marked \
                        ers1.is_assist marked \
                    FROM \
                        event_results ers1 \
                        INNER JOIN collaborators cs1 ON cs1.id = ers1.person_id \
                        INNER JOIN collaborator c1 ON c1.id = cs1.id \
                    WHERE \
                        ers1.event_id = es.id \
                        AND ers1.not_participate = 0 \
                        AND ISNULL(cs1.is_dismiss, 0) = 0 \
                        AND ISNULL(cs1.dismiss_date, '') = '' \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) [collaborators], \
                ISNULL(e.data.value('(event/max_person_num)[1]', 'int'), 0) max_person_num, \
                e.data.value('(event/custom_elems/custom_elem[name=''link'']/value)[1]', 'varchar(max)') qrcode_link \
            FROM \
                events es \
                INNER JOIN education_methods ems ON ems.id = es.education_method_id \
                INNER JOIN education_method em ON em.id = ems.id \
                INNER JOIN event e ON e.id = es.id \
            WHERE \
                es.id = " + iEventID + " \
        ";
        //alert(sQuery);
        oRes = ArrayOptFirstElem(XQuery(sQuery));

        aTrainerFiles = [];
        if (String(oRes.trainer_files) != "") {
            aTempFiles = XQuery("sql: \
                SELECT \
                    rs.id, \
                    CASE rs.type WHEN 'img' THEN RIGHT(rs.file_name, 3) ELSE rs.type END type, \
                    '/download_file.html?file_id=' + CAST(rs.id as VARCHAR(25)) url \
                FROM \
                    resources rs \
                WHERE rs.id IN(" + oRes.trainer_files + ") \
            ");

            for (oFile in aTempFiles) {
                aTrainerFiles.push({
                    id: String(oFile.id.Value),
                    type: String(oFile.type),
                    url: String(oFile.url)
                });
            }
        }

        oEvent = {
            "id": String(oRes.id),
            "title": String(oRes.title),
            "activity_id": String(oRes.activity_id),
            "places": String(oRes.max_person_num),
            "image": '/download_file.html?file_id=' + String(oRes.image),
            "description": String(oRes.description),
            "start_time": String(oRes.start_time),
            "start_date": String(oRes.start_date),
            "end_date": String(oRes.end_date),
            "time": String(oRes.time),
            "status": String(oRes.status),
            "state_id": String(oRes.state_id),
            "trainer": getArrFromXML(oRes.trainer.Value),
            "training_files": getArrFromXML(oRes.training_files.Value),
            "trainer_files": aTrainerFiles,
            "links": (String(oRes.links) != "" ? tools.read_object(oRes.links) : []),
            "collaborators": getArrFromXML(oRes.collaborators.Value),
            "qrcode_link": String(oRes.qrcode_link)
        };

        return EncodeJson({ success: true, error: "", data: oEvent });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Список доступных мероприятий для записи по учебной программе (обучающей активности)
/**
 * title                    название из УП
 * time                     время начала
 * date                     дата начал
 * status                   "нет мест" || "уже записан" || "записаться"
 */
function GetListEventsEduProgram(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var aEvents = [];
        var iEduMethodID = OptInt(params.education_method_id, 0);
        var iUserID = OptInt(user_id, 0);

        sQuery = "sql: \
            DECLARE \
                @curUserID BIGINT = " + iUserID + ", \
                @eduMethodID BIGINT = " + iEduMethodID + "; \
            SELECT \
                es.id, \
                ems.name title, \
                FORMAT( es.start_date, 'HH:mm', 'en-US' ) time, \
                FORMAT( es.start_date, 'yyyy.MM.dd', 'en-US' ) date, \
                CASE \
                    WHEN EXISTS(SELECT TOP 1 id FROM event_results ers WHERE ers.event_id = es.id AND ers.person_id = @curUserID AND ers.not_participate = 0) THEN 'уже записан' \
                    -- WHEN EXISTS(SELECT TOP 1 id FROM event_results ers WHERE ers.event_id = es.id AND ers.person_id = @curUserID AND ers.not_participate = 1) THEN 'отказался от участия' \
                    WHEN e.data.value('(event/max_person_num)[1]', 'int') IS NOT NULL AND ISNULL(e.data.value('(event/max_person_num)[1]', 'int'), 0) <= (SELECT COUNT(1) FROM event_results ers WHERE ers.event_id = es.id AND ers.not_participate = 0) THEN 'нет мест' \
                    ELSE 'записаться' \
                END status \
            FROM \
                events es \
                INNER JOIN event e ON e.id = es.id \
                INNER JOIN education_methods ems ON ems.id = es.education_method_id \
            WHERE \
                es.education_method_id = @eduMethodID \
                AND es.start_date >= GETDATE() \
                AND es.status_id IN('plan', 'project', 'active') \
        ";
        aResult = XQuery(sQuery);

        for (oRes in aResult) {
            aEvents.push({
                "id": String(oRes.id),
                "title": String(oRes.title),
                "time": String(oRes.time),
                "date": String(oRes.date),
                "status": String(oRes.status)
            });
        }

        return EncodeJson({ success: true, error: "", data: aEvents });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Генерация qr-кода по ссылке 
/**
 * options      временный файл создавать в корзине или на сервере
 * text         текст для формирования qr-кода
 */
function GenerateQRLink(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var webUtil = tools.get_object_assembly('WebUtils');
        var sTempUrl = (params.options & 1) == 1 ? ('x-local://trash/temp/QR' + tools.random_string(10) + '.png') : ObtainSessionTempFile('.png');

        webUtil.QrGen(params.text, UrlToFilePath(sTempUrl));

        if (webUtil.IsError)
            return EncodeJson({ success: false, error: "GenerateQRLink | " + webUtil.GetError(), data: [] });
        else
            return EncodeJson({ success: true, error: "", data: sTempUrl });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Эскпорт списка сотрудников
/**
 * event_id     ID обучающей активности
 */
function ExportListCollaboratorsFromEvent(user_id, teUser, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var iEventID = OptInt(params.event_id, 0);
        var sUrl = "";
        var aData = XQuery("sql: \
            DECLARE @eventID BIGINT = " + iEventID + "; \
            SELECT \
                ers.event_name, \
                ers.person_fullname, \
                ers.person_position_name, \
                CASE ers.is_assist WHEN 1 THEN 'Да' ELSE '' END assist, \
                CASE ers.not_participate WHEN 1 THEN 'Да' ELSE '' END not_participate, \
                er.data.value('(event_result/comment)[1]', 'varchar(max)') comment, \
                cs.code \
            FROM \
                event_results ers \
                INNER JOIN collaborators cs ON cs.id = ers.person_id \
                INNER JOIN event_result er ON er.id = ers.id \
            WHERE \
                ers.event_id = @eventID \
        ");
        var oEvent = ArrayOptFirstElem(aData);

        if (oEvent != undefined) {
            var aHeaderExcel = [
                { title: "Название отчета", value: 'Список сотрудников по мероприятию "' + oEvent.event_name + '"' },
                { title: "Дата формирования отчета", value: StrDate(Date(), false, false) }
            ];

            var aTitleExcel = [
                { name: "person_fullname", title: "ФИО сотрудника", width: 30 },
                { name: "code", title: "Табельный номер", width: 30 },
                { name: "person_position_name", title: "Подразделение", width: 50 },
                { name: "assist", title: "Присутствие", width: 25 },
                { name: "not_participate", title: "Отказался от участия", width: 25 },
                { name: "comment", title: "Комментарий", width: 25 }
            ];

            sUrl = createExcel(aData, aTitleExcel, aHeaderExcel, user_id);

            return EncodeJson({ success: true, error: "", data: sUrl });
        } else {
            return EncodeJson({ success: false, error: "Список сотрудников пуст", data: "" });
        }
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: "" });
    }
}

// формирование файла excel
function createExcel(arrReport, aTitleExcel, aHeaderExcel, curUserID) {
	var bsResultHTML = new BufStream;
	// bsResultHTML.WriteStr('<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/><meta name="ProgId" content="Excel.Sheet"/><meta name="Generator" content="Microsoft Excel 11"/></head><body><table border="1" cellpadding="2" cellspacing="0">');
	bsResultHTML.WriteStr('<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/><meta name=ProgId content="Excel.Sheet" /><meta name="Generator" content="Microsoft Excel 15"/></head><body><table border="1" cellpadding="2" cellspacing="0">');
	bsResultHTML.WriteStr('<tbody>');

    for(oColumn in aHeaderExcel){
        bsResultHTML.WriteStr('<tr><th>' + oColumn.GetOptProperty("title", "") + '</th>');
	    bsResultHTML.WriteStr('<th colspan="4">' + oColumn.GetOptProperty("value", "") + '</th></tr>');
    }

    bsResultHTML.WriteStr('<tr></tr><tr>');
	for (oColumn in aTitleExcel){
    	bsResultHTML.WriteStr('<th>' + oColumn.GetOptProperty("title", "") + '</th>');
    }
	bsResultHTML.WriteStr('</tr>');
	for (oResult in arrReport)
	{
		bsResultHTML.WriteStr('<tr>');
		for (oColumn in aTitleExcel){
            bsResultHTML.WriteStr('<td>' + oResult.GetOptProperty(oColumn.name, "") + '</td>');
        }
		bsResultHTML.WriteStr('</tr>');
	}

	bsResultHTML.WriteStr('</tbody></table></body></html>');
	var sUrl = 'list_col_by_' + curUserID;
	PutUrlData(UrlAppendPath("x-local://trash/temp/", sUrl + ".html"), bsResultHTML.DetachStr());

	return "/assessment_excel_export.html?mode=htmlfileurl&htmlfileurl=" + sUrl;
}

// Изменение статуса мероприятия
/**
 * id                    ID мероприятия
 * status_id             статус
 */
function ChangeStateEvent(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var docEvent = tools.open_doc(params.id);
        docEvent.TopElem.status_id = params.status_id;
        docEvent.Save();

        return EncodeJson({ success: true, error: "", data: [{ id: String(params.id), status_id: params.status_id }] });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Отметить посещение у сотрудников
/**
 * id                    ID мероприятия
 * collaborators         сотрудники
 *      id               ID сотрудника
 *      marked           отметка о посещении
 */
function AssistCollaboratorsEvent(user_id, httpRequest) {
    try {
        var params = DecodeJson(httpRequest.Body);
        var iEventID = OptInt(params.event_id, 0);
        var aEventResults = XQuery("sql: SELECT id, person_id, is_assist marked FROM event_results WHERE event_id = " + iEventID);
        var aNewValAssistCollaborators = ArraySort(params.collaborators, "id", "+");

        for (oEventResult in aEventResults) {
            oNewAssist = ArrayOptFindBySortedKey(aNewValAssistCollaborators, String(oEventResult.person_id), "id");
            if (oNewAssist != undefined) {
                bAssist = tools_web.is_true(oNewAssist.marked);

                if (oEventResult.marked != bAssist) {
                    docEventResult = tools.open_doc(oEventResult.id);
                    docEventResult.TopElem.is_assist = bAssist;
                    docEventResult.Save();
                }
            }
        }

        return EncodeJson({ success: true, error: "", data: aNewValAssistCollaborators });
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: [] });
    }
}

// Получение данных о мероприятии по ID
/**
 * id       ID мероприятия
 */
function GetInfoEvent(user_id, httpRequest) {
    var oReturnEvent = undefined;

    try {
        var params = DecodeJson(httpRequest.Body);

        sQuery = "sql: \
            DECLARE @eventID BIGINT = " + OptInt(params.id, 0) + " \
            SELECT TOP 1 \
                es.id, \
                es.education_method_id activity_id, \
                ems.name title, \
                FORMAT( es.start_date, 'HH:mm', 'en-US' ) start_time, \
                FORMAT( es.start_date, 'yyyy.MM.dd', 'en-US' ) start_date, \
                FORMAT( es.finish_date, 'dd.MM.yyyy', 'en-US' ) end_date, \
                CASE es.status_id \
                    WHEN 'active' THEN 'В процессе' \
                    WHEN 'cancel' THEN 'Отменено' \
                    WHEN 'close' THEN 'Завершено' \
                    ELSE 'Ожидается' \
                END status, \
                ( \
                    SELECT \
                        CAST(cs1.id AS VARCHAR(MAX)) id, \
                        c1.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                        c1.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                        cs1.pict_url avatar, \
                        cs1.sex gender, \
                        cs1.fullname, \
                        cs1.position_name position_name, \
                        c1.data.value('(collaborator/desc)[1]', 'varchar(max)') [desc] \
                    FROM \
                        event_lectors els \
                        INNER JOIN collaborators cs1 ON cs1.id = els.person_id \
                        INNER JOIN collaborator c1 ON c1.id = cs1.id \
                    WHERE \
                        els.event_id = es.id \
                        AND ISNULL(cs1.is_dismiss, 0) = 0 \
                        AND ISNULL(cs1.dismiss_date, '') = '' \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) [trainer], \
                em.data.value('(education_method/custom_elems/custom_elem[name=''links'']/value)[1]', 'varchar(max)') links, \
                ( \
                    SELECT \
                        CAST(c1.id AS VARCHAR(MAX)) id, \
                        c1.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                        c1.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname, \
                        cs1.pict_url avatar, \
                        cs1.sex gender, \
                        CASE ers1.is_assist WHEN 1 THEN 'true' ELSE 'false' END marked \
                    FROM \
                        event_results ers1 \
                        INNER JOIN collaborators cs1 ON cs1.id = ers1.person_id \
                        INNER JOIN collaborator c1 ON c1.id = cs1.id \
                    WHERE \
                        ers1.event_id = es.id \
                        AND ers1.not_participate = 0 \
                        AND ISNULL(cs1.is_dismiss, 0) = 0 \
                        AND ISNULL(cs1.dismiss_date, '') = '' \
                    FOR XML PATH, ELEMENTS XSINIL, root('rows') \
                ) [collaborators], \
                ISNULL(e.data.value('(event/max_person_num)[1]', 'int'), 0) places, \
                e.data.value('(event/custom_elems/custom_elem[name=''link'']/value)[1]', 'varchar(max)') qrcode_link \
            FROM \
                events es \
                INNER JOIN education_methods ems ON ems.id = es.education_method_id \
                INNER JOIN education_method em ON em.id = ems.id \
                INNER JOIN event e ON e.id = es.id \
            WHERE \
                es.id = @eventID \
        ";
        oRes = ArrayOptFirstElem(XQuery(sQuery));

        if (oRes != undefined) {
            oReturnEvent = {
                "id": String(oRes.id),
                "title": String(oRes.title),
                "activity_id": String(oRes.activity_id),
                "start_time": String(oRes.start_time),
                "start_date": String(oRes.start_date),
                "end_date": String(oRes.end_date),
                "trainer": getArrFromXML(oRes.trainer.Value),
                "links": (String(oRes.links) != "" ? tools.read_object(oRes.links) : []),
                "collaborators": getArrFromXML(oRes.collaborators.Value),
                "places": String(oRes.places),
                "qrcode_link": String(oRes.qrcode_link)
            };

            return EncodeJson({ success: true, error: "", data: oReturnEvent });
        } else {
            return EncodeJson({ success: false, error: "Мероприятие не найдено", data: oReturnEvent });
        }
    } catch (e) {
        return EncodeJson({ success: false, error: e, data: oReturnEvent });
    }
}

// список сотрудников, которые могут быть тренерами в мероприятии
/**
 * 
 */
function GetTrainersForEvent(user_id, httpRequest) {
    try {
        var aCollaborators = [];

        sQuery = "sql: \
            SELECT \
                cs.id, \
                cs.code, \
                cs.fullname, \
                c.data.value('(collaborator/firstname)[1]', 'varchar(max)') firstname, \
                c.data.value('(collaborator/lastname)[1]', 'varchar(max)') lastname \
            FROM \
                lectors ls \
                INNER JOIN collaborators cs ON cs.id = ls.person_id \
                INNER JOIN collaborator c ON c.id = cs.id \
            WHERE \
                ISNULL(cs.is_dismiss, 0) = 0 \
                AND ISNULL(cs.dismiss_date, '') = '' \
            ORDER BY cs.fullname \
        ";

        aResult = XQuery(sQuery);
        for (elem in aResult) {
            aCollaborators.push({
                id: String(elem.id),
                code: String(elem.code),
                fullname: String(elem.fullname),
                firstname: String(elem.firstname),
                lastname: String(elem.lastname)
            })
        }

        return EncodeJson({ success: true, error: "", data: aCollaborators });
    } catch (e) {
        alert(e);
        return EncodeJson({ success: false, error: e, data: [] });
    }
}