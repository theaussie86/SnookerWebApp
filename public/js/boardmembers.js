$(function(){
    moment.locale('de');
    $('#allMembers').on('click','tr', function() {
        var $tds = $(this).find('td');
        var username = $tds[0].textContent;
        var firstname = $tds[1].textContent;
        var lastname = $tds[2].textContent;

        $('#memberships').empty();
        $.ajax({
            type: 'GET',
            url: '/board/membership',
            data: {username: username},
            success: function(data){
                $('#memberModalLabel').text(data.username+"'s Mitgliedschaften");
                if (!data.aktiv){
                    $('.modal-footer').prepend('<button id="newmembership" type="button" class="btn btn-primary">Mitgliedschaft hinzufügen</button>');
                }
                data.memberships.forEach(function(item){
                    var ende;
                    var aktiv;
                    var save;
                    var type;
                    if (new Date(item.membershipEnd).getTime()===0) {
                        ende = 'Enddatum eingeben';
                        aktiv = 'id="enterende"';
                        save = '<button type="submit" class="btn btn-primary mb-2 mr-sm-2 mb-sm-0">Speichern</button>';
                        type = 'date';
                    } else {
                        ende = moment(item.membershipEnd).format('DD.MM.YYYY');
                        aktiv = 'readonly';
                        save = '';
                        type = 'text';
                    }
                    var dataString = '<form action="/board/editmembership" class="form-group my-2"><div class="form-row"><div class="form-col-6"><label>Typ</label><input name="membershipType" type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" value="'+
                    item.membershipType+'" readonly></div><div class="form-col-6"><label>Beitrag</label><input name="membershipFee" type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" value="'+
                    item.membershipFee.toFixed(2).replace('.',',')+' €" readonly></div></div><div class="form-row"><div class="form-col-6"><label>Beginn</label><input name="membershipStart" type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" value="'+
                    moment(item.membershipStart).format('DD.MM.YYYY')+'" readonly></div><div class="form-col-6"><label>Ende</label><input type="'+type+'" name="membershipEnd" class="form-control mb-2 mr-sm-2 mb-sm-0" placeholder="'+
                    ende+'" '+aktiv+'>'+save+'<input name="username" type="text" value="'+
                    data.username+'" style="display: none;"></div></div></form><hr>';
                    $('#memberships').append(dataString);

                    $('#newmembership').on('click',function () {
                        var dataString = '<form action="/board/newmembership" class="form-group my-2"><div class="form-row"><div class="form-col-6"><label>Typ</label><input name="membershipType" type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" placeholder="Art"></div><div class="form-col-6"><label>Beitrag</label><input name="membershipFee" type="text" class="form-control mb-2 mr-sm-2 mb-sm-0" placeholder="Beitrag eingeben"></div></div><div class="form-row"><div class="form-col-6"><label>Beginn</label><input name="membershipStart" type="date" class="form-control mb-2 mr-sm-2 mb-sm-0"></div><div class="form-col-6"><label>Ende</label><input type="date" name="membershipEnd" class="form-control mb-2 mr-sm-2 mb-sm-0">'+save+'<input name="username" type="text" value="'+
                        data.username+'" style="display: none;"></div></div></form>';
                        $('#memberships').append(dataString);
                    });
                
                });
            }
        });
    });
});